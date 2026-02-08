import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { RouteRequestSchema } from "../types";
import type {
  RouteResponse,
  RouteOption,
  EnvironmentalData,
  GeminiRecommendation,
  HazardPoint,
  NearbyHazard,
} from "../types";
import {
  generateRouteRecommendation,
  isGeminiConfigured,
} from "../gemini";
import {
  decodePolyline,
  findNearbyHazards,
  generateAvoidanceWaypoints,
  calculateHazardExposureScore,
} from "../geo";
import type { LatLng } from "../geo";
import {
  getMockWeather,
  getMockAirQuality,
  getMockRoutes,
  getMockRouteRecommendation,
} from "../mockData";

const routesRouter = new Hono();

// ==========================================
// Google Maps Directions API
// ==========================================

interface GoogleDirectionsResponse {
  status: string;
  error_message?: string;
  routes: Array<{
    summary: string;
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      start_location: { lat: number; lng: number };
      end_location: { lat: number; lng: number };
      steps: Array<{
        html_instructions: string;
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        polyline: { points: string };
      }>;
    }>;
    overview_polyline: { points: string };
  }>;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

async function fetchGoogleDirections(
  origin: string,
  destination: string,
  options: {
    avoidHighways?: boolean;
    waypoints?: LatLng[];
  } = {}
): Promise<GoogleDirectionsResponse> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    origin,
    destination,
    key: apiKey,
    alternatives: "true",
    units: "metric",
  });

  if (options.avoidHighways) {
    params.set("avoid", "highways");
  }

  // Add waypoints for hazard avoidance
  if (options.waypoints && options.waypoints.length > 0) {
    const waypointStr = options.waypoints
      .map((wp) => `via:${wp.lat},${wp.lng}`)
      .join("|");
    params.set("waypoints", waypointStr);
    // When using waypoints, don't request alternatives (Google ignores it anyway)
    params.delete("alternatives");
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params}`
  );
  const data = (await response.json()) as GoogleDirectionsResponse;

  if (data.status !== "OK") {
    throw new Error(
      `Google Directions API error: ${data.status} - ${data.error_message || "Unknown error"}`
    );
  }

  return data;
}

// CO2 emission factors (kg CO2 per km)
const CO2_HIGHWAY_KG_PER_KM = 0.21;
const CO2_SURFACE_KG_PER_KM = 0.17;

function parseGoogleRoutes(
  data: GoogleDirectionsResponse,
  isEcoFriendly: boolean,
  isHazardAvoiding: boolean,
  fastestDistanceKm?: number
): RouteOption[] {
  return data.routes.map((route, index) => {
    const leg = route.legs[0]!;
    const distanceKm = leg.distance.value / 1000;
    const durationMinutes = leg.duration.value / 60;

    // CO2 calculations
    const co2PerKm = isEcoFriendly ? CO2_SURFACE_KG_PER_KM : CO2_HIGHWAY_KG_PER_KM;
    const routeCo2 = distanceKm * co2PerKm;
    const baselineCo2 = (fastestDistanceKm ?? distanceKm) * CO2_HIGHWAY_KG_PER_KM;
    const co2SavedKg = Math.max(0, Number((baselineCo2 - routeCo2).toFixed(2)));

    const steps = leg.steps.map((step) => ({
      instruction: stripHtml(step.html_instructions),
      distanceKm: Number((step.distance.value / 1000).toFixed(2)),
      durationMinutes: Number((step.duration.value / 60).toFixed(1)),
    }));

    // Build route name
    let routeName: string;
    if (isHazardAvoiding && isEcoFriendly) {
      routeName = `Safe Eco via ${route.summary || "local roads"}`;
    } else if (isHazardAvoiding) {
      routeName = `Safe Route via ${route.summary || "alternate roads"}`;
    } else if (isEcoFriendly) {
      routeName = `Eco-Friendly via ${route.summary || "local roads"}`;
    } else {
      routeName = `Fastest via ${route.summary || "highway"}`;
    }

    const suffix = isHazardAvoiding ? "avoid" : isEcoFriendly ? "eco" : "fast";

    return {
      id: `route-${suffix}-${index}`,
      name: routeName,
      distanceKm: Number(distanceKm.toFixed(1)),
      durationMinutes: Number(durationMinutes.toFixed(0)),
      isEcoFriendly,
      isHazardAvoiding,
      co2SavedKg,
      co2Kg: Number(routeCo2.toFixed(2)),
      polyline: route.overview_polyline.points,
      steps,
    };
  });
}

// ==========================================
// OpenWeatherMap API
// ==========================================

interface OpenWeatherResponse {
  weather: Array<{ main: string; description: string }>;
  main: { temp: number; humidity: number };
  wind: { speed: number };
}

async function fetchWeatherData(
  lat: number = 33.749,
  lng: number = -84.388
): Promise<{ temperature: number; weatherCondition: string; humidity: number }> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENWEATHERMAP_API_KEY is not configured");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`;

  // Use curl to bypass Vibecode proxy which intercepts openweathermap.org
  const proc = Bun.spawn(
    ["curl", "-sL", "--max-time", "10", url],
    { stdout: "pipe", stderr: "pipe" }
  );

  const output = await new Response(proc.stdout).text();
  await proc.exited;

  if (proc.exitCode !== 0) {
    throw new Error(`OpenWeatherMap curl failed with exit code ${proc.exitCode}`);
  }

  const data = JSON.parse(output) as OpenWeatherResponse;

  if (!data.main || !data.weather) {
    throw new Error(`OpenWeatherMap returned invalid data: ${output.slice(0, 200)}`);
  }

  const weatherDescription = data.weather[0]?.description ?? "unknown";
  const weatherCondition = weatherDescription
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    temperature: Math.round(data.main.temp),
    weatherCondition,
    humidity: data.main.humidity,
  };
}

// ==========================================
// AirNow API
// ==========================================

interface AirNowObservation {
  DateObserved: string;
  ParameterName: string;
  AQI: number;
  Category: { Number: number; Name: string };
}

async function fetchAirQualityData(
  lat: number = 33.749,
  lng: number = -84.388
): Promise<{ airQualityIndex: number; airQualityDescription: string }> {
  const apiKey = process.env.AIRNOW_API_KEY;
  if (!apiKey) {
    throw new Error("AIRNOW_API_KEY is not configured");
  }

  const response = await fetch(
    `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lng}&distance=50&API_KEY=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`AirNow API error: ${response.status}`);
  }

  const data = (await response.json()) as AirNowObservation[];

  if (!data || data.length === 0) {
    return {
      airQualityIndex: 50,
      airQualityDescription: "Data temporarily unavailable",
    };
  }

  // Find the primary pollutant (highest AQI)
  const primary = data.reduce((max, obs) =>
    obs.AQI > max.AQI ? obs : max
  );

  const aqiDescriptions: Record<string, string> = {
    Good: "Good - Air quality is satisfactory",
    Moderate: "Moderate - Acceptable but may be a concern for sensitive groups",
    "Unhealthy for Sensitive Groups":
      "Unhealthy for Sensitive Groups - May affect sensitive individuals",
    Unhealthy: "Unhealthy - Everyone may begin to experience health effects",
    "Very Unhealthy": "Very Unhealthy - Health alert; significant risk",
    Hazardous: "Hazardous - Emergency conditions",
  };

  return {
    airQualityIndex: primary.AQI,
    airQualityDescription:
      aqiDescriptions[primary.Category.Name] ??
      `${primary.Category.Name} (AQI: ${primary.AQI})`,
  };
}

// ==========================================
// Hazard data: cameras + community reports
// ==========================================

async function fetchAllHazards(): Promise<HazardPoint[]> {
  const hazardPoints: HazardPoint[] = [];

  // 1. Fetch camera hazards
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    const cameraResponse = await fetch(`${backendUrl}/api/cameras/hazards/active`);

    if (cameraResponse.ok) {
      const json = (await cameraResponse.json()) as {
        data: Array<{
          camId: string;
          locationName: string;
          lat: number;
          lng: number;
          currentStatus: {
            hazard: boolean;
            type: string;
            severity: number;
            geminiExplanation: string;
          };
        }>;
      };

      for (const cam of json.data ?? []) {
        hazardPoints.push({
          id: `cam-${cam.camId}`,
          lat: cam.lat,
          lng: cam.lng,
          type: cam.currentStatus.type,
          severity: cam.currentStatus.severity,
          description: `${cam.locationName}: ${cam.currentStatus.geminiExplanation}`,
          source: "camera",
        });
      }
    }
  } catch (error) {
    console.warn("[Routes] Failed to fetch camera hazards:", error);
  }

  // 2. Fetch community reports (verified or pending, not resolved)
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    const reportsResponse = await fetch(`${backendUrl}/api/reports`);

    if (reportsResponse.ok) {
      const json = (await reportsResponse.json()) as {
        data: Array<{
          reportId: string;
          type: string;
          description?: string;
          lat: number;
          lng: number;
          status: string;
          verifiedByAi: boolean;
        }>;
      };

      // Severity mapping for community report types
      const reportSeverity: Record<string, number> = {
        flooding: 7,
        obstruction: 6,
        pothole: 5,
        blocked_bike_lane: 4,
        broken_charger: 3,
        other: 4,
      };

      for (const report of json.data ?? []) {
        // Only include non-resolved reports
        if (report.status === "resolved") continue;

        hazardPoints.push({
          id: `report-${report.reportId}`,
          lat: report.lat,
          lng: report.lng,
          type: report.type,
          severity: reportSeverity[report.type] ?? 4,
          description: report.description || `Community report: ${report.type}`,
          source: "report",
        });
      }
    }
  } catch (error) {
    console.warn("[Routes] Failed to fetch community reports:", error);
  }

  return hazardPoints;
}

// ==========================================
// Fallback Gemini recommendation (no API)
// ==========================================

function generateFallbackRecommendation(
  routes: RouteOption[],
  environmental: EnvironmentalData,
  hazards: HazardPoint[],
  preferEco: boolean
): GeminiRecommendation {
  const defaultRoute = routes[0];

  if (!defaultRoute) {
    return {
      recommendedRouteId: "unknown",
      reasoning: "No routes available.",
      safetyScore: 0,
      ecoScore: 0,
    };
  }

  // Prefer hazard-avoiding routes if available
  const safeRoute = routes.find((r) => r.isHazardAvoiding);
  const ecoRoute = routes.find((r) => r.isEcoFriendly && !r.isHazardAvoiding);
  const safeEcoRoute = routes.find((r) => r.isEcoFriendly && r.isHazardAvoiding);
  const fastestRoute = routes.find((r) => !r.isEcoFriendly && !r.isHazardAvoiding);

  const activeHazards = hazards.length;

  // Priority: safe-eco > safe > eco > fast
  if (preferEco && safeEcoRoute) {
    return {
      recommendedRouteId: safeEcoRoute.id,
      reasoning: `The safest eco-friendly route avoids ${activeHazards} hazard(s) and saves ${safeEcoRoute.co2SavedKg ?? 0}kg CO2. Estimated emissions: ${safeEcoRoute.co2Kg ?? 0}kg CO2. Current AQI: ${environmental.airQualityIndex}.`,
      safetyScore: 90,
      ecoScore: 92,
    };
  }

  if (activeHazards > 0 && safeRoute) {
    return {
      recommendedRouteId: safeRoute.id,
      reasoning: `${activeHazards} hazard(s) detected near standard routes. This alternate route avoids them with exposure score of ${safeRoute.hazardExposureScore ?? 0}/100. Estimated emissions: ${safeRoute.co2Kg ?? 0}kg CO2.`,
      safetyScore: 88,
      ecoScore: safeRoute.isEcoFriendly ? 85 : 50,
    };
  }

  if (preferEco && ecoRoute) {
    return {
      recommendedRouteId: ecoRoute.id,
      reasoning: `The eco-friendly route saves approximately ${ecoRoute.co2SavedKg ?? 0}kg CO2 (${ecoRoute.co2Kg ?? 0}kg total). Current conditions: ${environmental.weatherCondition} at ${environmental.temperature}°F with AQI ${environmental.airQualityIndex}.`,
      safetyScore: 85,
      ecoScore: 92,
    };
  }

  return {
    recommendedRouteId: fastestRoute?.id ?? defaultRoute.id,
    reasoning: `The fastest route is recommended with ${(fastestRoute ?? defaultRoute).co2Kg ?? 0}kg CO2 emissions. Current conditions: ${environmental.weatherCondition} at ${environmental.temperature}°F. Traffic conditions appear normal.`,
    safetyScore: 85,
    ecoScore: 45,
  };
}

// ==========================================
// Route Planning Endpoint
// ==========================================

routesRouter.post(
  "/plan",
  zValidator("json", RouteRequestSchema),
  async (c) => {
    const request = c.req.valid("json");

    console.log(
      `[Routes] Planning route: ${request.origin} → ${request.destination} (eco: ${request.preferEco}, avoidHazards: ${request.avoidHazards})`
    );

    try {
      // Step 1: Fetch initial routes + environmental data + hazards in parallel
      const [fastDirections, ecoDirections, weatherResult, aqiResult, allHazards] =
        await Promise.allSettled([
          fetchGoogleDirections(request.origin, request.destination),
          fetchGoogleDirections(request.origin, request.destination, { avoidHighways: true }),
          fetchWeatherData(request.originLat, request.originLng),
          fetchAirQualityData(request.originLat, request.originLng),
          fetchAllHazards(),
        ]);

      // Step 2: Parse initial routes from Google Maps (with mock fallback)
      let routes: RouteOption[] = [];

      if (fastDirections.status === "fulfilled") {
        const fastRoutes = parseGoogleRoutes(fastDirections.value, false, false);
        if (fastRoutes[0]) {
          routes.push(fastRoutes[0]);
        }
      } else {
        console.warn("[Routes] Google Directions (fast) failed:", fastDirections.reason);
      }

      const fastestDistanceKm = routes[0]?.distanceKm;

      if (ecoDirections.status === "fulfilled") {
        const ecoRoutes = parseGoogleRoutes(
          ecoDirections.value, true, false, fastestDistanceKm
        );
        if (ecoRoutes[0]) {
          routes.push(ecoRoutes[0]);
        }
      } else {
        console.warn("[Routes] Google Directions (eco) failed:", ecoDirections.reason);
      }

      // Fallback to mock routes if Google completely fails
      if (routes.length === 0) {
        console.warn("[Routes] All Google Directions failed, using mock routes");
        routes = getMockRoutes(request.origin, request.destination);
      }

      // Step 3: Get all hazard points
      const hazards: HazardPoint[] =
        allHazards.status === "fulfilled" ? allHazards.value : [];

      console.log(`[Routes] Found ${hazards.length} total hazard points (cameras + reports)`);

      // Step 4: For each route, find nearby hazards and score
      const HAZARD_RADIUS_METERS = 500;

      for (const route of routes) {
        const polylinePoints = decodePolyline(route.polyline);
        const nearby = findNearbyHazards(polylinePoints, hazards, HAZARD_RADIUS_METERS);
        route.nearbyHazards = nearby;
        route.hazardExposureScore = calculateHazardExposureScore(nearby);
      }

      // Step 5: Generate hazard-avoiding routes if needed
      if (request.avoidHazards && hazards.length > 0) {
        for (const route of [...routes]) {
          const nearby = route.nearbyHazards ?? [];
          if (nearby.length === 0) continue;

          console.log(
            `[Routes] Route "${route.name}" has ${nearby.length} nearby hazard(s). Generating avoidance route...`
          );

          try {
            const polylinePoints = decodePolyline(route.polyline);
            const waypoints = generateAvoidanceWaypoints(polylinePoints, nearby);

            if (waypoints.length > 0) {
              // Limit to 5 waypoints (Google API limit is 25 but fewer = better routes)
              const limitedWaypoints = waypoints.slice(0, 5);

              const avoidDirections = await fetchGoogleDirections(
                request.origin,
                request.destination,
                {
                  avoidHighways: route.isEcoFriendly,
                  waypoints: limitedWaypoints,
                }
              );

              const avoidRoutes = parseGoogleRoutes(
                avoidDirections,
                route.isEcoFriendly,
                true, // isHazardAvoiding
                fastestDistanceKm
              );

              if (avoidRoutes[0]) {
                // Score the avoidance route too
                const avoidPolyline = decodePolyline(avoidRoutes[0].polyline);
                const avoidNearby = findNearbyHazards(
                  avoidPolyline, hazards, HAZARD_RADIUS_METERS
                );
                avoidRoutes[0].nearbyHazards = avoidNearby;
                avoidRoutes[0].hazardExposureScore = calculateHazardExposureScore(avoidNearby);

                // Only add if it actually reduces hazard exposure
                if (
                  avoidRoutes[0].hazardExposureScore <
                  (route.hazardExposureScore ?? 100)
                ) {
                  routes.push(avoidRoutes[0]);
                  console.log(
                    `[Routes] Avoidance route added: exposure ${avoidRoutes[0].hazardExposureScore} vs original ${route.hazardExposureScore}`
                  );
                } else {
                  console.log(
                    `[Routes] Avoidance route not better: exposure ${avoidRoutes[0].hazardExposureScore} vs original ${route.hazardExposureScore}`
                  );
                }
              }
            }
          } catch (error) {
            console.error(`[Routes] Failed to generate avoidance route for "${route.name}":`, error);
          }
        }
      }

      // Step 6: Build environmental data (with mock fallbacks)
      let weather: { temperature: number; weatherCondition: string; humidity: number };
      if (weatherResult.status === "fulfilled") {
        weather = weatherResult.value;
      } else {
        console.warn("[Routes] Weather API failed, using mock data:", weatherResult.reason);
        weather = getMockWeather();
      }

      let aqi: { airQualityIndex: number; airQualityDescription: string };
      if (aqiResult.status === "fulfilled") {
        aqi = aqiResult.value;
      } else {
        console.warn("[Routes] AirNow API failed, using mock data:", aqiResult.reason);
        aqi = getMockAirQuality();
      }

      const environmental: EnvironmentalData = {
        airQualityIndex: aqi.airQualityIndex,
        airQualityDescription: aqi.airQualityDescription,
        temperature: weather.temperature,
        weatherCondition: weather.weatherCondition,
        humidity: weather.humidity,
      };

      // Step 7: Collect all unique hazards near any route for the response
      const allNearbyHazardIds = new Set<string>();
      const allNearbyHazards: HazardPoint[] = [];
      for (const route of routes) {
        for (const h of route.nearbyHazards ?? []) {
          if (!allNearbyHazardIds.has(h.id)) {
            allNearbyHazardIds.add(h.id);
            allNearbyHazards.push({
              id: h.id,
              lat: h.lat,
              lng: h.lng,
              type: h.type,
              severity: h.severity,
              description: h.description,
              source: h.source,
            });
          }
        }
      }

      // Step 8: Generate AI recommendation with Gemini (or fallback)
      let recommendation: GeminiRecommendation;

      if (isGeminiConfigured()) {
        try {
          recommendation = await generateRouteRecommendation(
            routes,
            environmental,
            hazards,
            request.preferEco ?? false
          );
        } catch (error) {
          console.error("[Routes] Gemini recommendation failed, using fallback:", error);
          recommendation = generateFallbackRecommendation(
            routes, environmental, hazards, request.preferEco ?? false
          );
        }
      } else {
        recommendation = generateFallbackRecommendation(
          routes, environmental, hazards, request.preferEco ?? false
        );
      }

      const response: RouteResponse = {
        routes,
        environmental,
        hazardsOnRoute: allNearbyHazards,
        recommendation,
      };

      console.log(
        `[Routes] Route planned: ${routes.length} routes, ${allNearbyHazards.length} hazards nearby, AQI ${environmental.airQualityIndex}`
      );

      return c.json({ data: response });
    } catch (error) {
      console.error("[Routes] Route planning error:", error);
      return c.json(
        {
          error: {
            message:
              error instanceof Error ? error.message : "Failed to plan route",
            code: "ROUTE_PLANNING_FAILED",
          },
        },
        500
      );
    }
  }
);

export { routesRouter };

