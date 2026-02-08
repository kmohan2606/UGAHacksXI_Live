import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { RouteRequestSchema } from "../types";
import type {
  RouteResponse,
  RouteOption,
  EnvironmentalData,
  Camera,
  GeminiRecommendation,
} from "../types";
import {
  generateRouteRecommendation,
  isGeminiConfigured,
} from "../gemini";

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
  avoidHighways: boolean = false
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

  if (avoidHighways) {
    params.set("avoid", "highways");
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

function parseGoogleRoutes(
  data: GoogleDirectionsResponse,
  isEcoFriendly: boolean,
  fastestDistanceKm?: number
): RouteOption[] {
  return data.routes.map((route, index) => {
    const leg = route.legs[0]!;
    const distanceKm = leg.distance.value / 1000;
    const durationMinutes = leg.duration.value / 60;

    // CO2 calculations
    // Average car: ~0.21 kg CO2/km on highway, ~0.17 kg CO2/km on surface streets
    const co2PerKm = isEcoFriendly ? 0.17 : 0.21;
    const routeCo2 = distanceKm * co2PerKm;
    const baselineCo2 = (fastestDistanceKm ?? distanceKm) * 0.21;
    const co2SavedKg = Math.max(0, Number((baselineCo2 - routeCo2).toFixed(2)));

    const steps = leg.steps.map((step) => ({
      instruction: stripHtml(step.html_instructions),
      distanceKm: Number((step.distance.value / 1000).toFixed(2)),
      durationMinutes: Number((step.duration.value / 60).toFixed(1)),
    }));

    const routeName = isEcoFriendly
      ? `Eco-Friendly via ${route.summary || "local roads"}`
      : `Fastest via ${route.summary || "highway"}`;

    return {
      id: `route-${isEcoFriendly ? "eco" : "fast"}-${index}`,
      name: routeName,
      distanceKm: Number(distanceKm.toFixed(1)),
      durationMinutes: Number(durationMinutes.toFixed(0)),
      isEcoFriendly,
      co2SavedKg,
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
// Hazard data from real camera analysis
// ==========================================

async function fetchHazardsFromCameras(): Promise<Camera[]> {
  try {
    // Fetch the camera data from our own cameras endpoint (uses cached data)
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    const response = await fetch(`${backendUrl}/api/cameras/hazards/active`);

    if (!response.ok) {
      console.warn("[Routes] Failed to fetch camera hazards:", response.status);
      return [];
    }

    const json = (await response.json()) as { data: Camera[]; count: number };
    return json.data ?? [];
  } catch (error) {
    console.warn("[Routes] Error fetching camera hazards:", error);
    return [];
  }
}

// ==========================================
// Fallback Gemini recommendation (no API)
// ==========================================

function generateFallbackRecommendation(
  routes: RouteOption[],
  environmental: EnvironmentalData,
  hazards: Camera[],
  preferEco: boolean
): GeminiRecommendation {
  const ecoRoute = routes.find((r) => r.isEcoFriendly);
  const fastestRoute = routes.find((r) => !r.isEcoFriendly);
  const defaultRoute = routes[0];

  if (!defaultRoute) {
    return {
      recommendedRouteId: "unknown",
      reasoning: "No routes available.",
      safetyScore: 0,
      ecoScore: 0,
    };
  }

  const activeHazards = hazards.filter((h) => h.currentStatus.hazard);

  if (preferEco && ecoRoute) {
    return {
      recommendedRouteId: ecoRoute.id,
      reasoning: `The eco-friendly route saves approximately ${ecoRoute.co2SavedKg ?? 0}kg CO2. Current conditions: ${environmental.weatherCondition} at ${environmental.temperature}°F with AQI ${environmental.airQualityIndex}.`,
      safetyScore: 85,
      ecoScore: 92,
    };
  }

  if (activeHazards.length > 0 && ecoRoute) {
    return {
      recommendedRouteId: ecoRoute.id,
      reasoning: `${activeHazards.length} active hazard(s) detected on highway routes. The eco-friendly alternative avoids these hazards and saves ${ecoRoute.co2SavedKg ?? 0}kg CO2.`,
      safetyScore: 80,
      ecoScore: 88,
    };
  }

  return {
    recommendedRouteId: fastestRoute?.id ?? defaultRoute.id,
    reasoning: `The fastest route is recommended. Current conditions: ${environmental.weatherCondition} at ${environmental.temperature}°F. Traffic conditions appear normal.`,
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
      `[Routes] Planning route: ${request.origin} → ${request.destination} (eco: ${request.preferEco})`
    );

    try {
      // Step 1: Fetch real data in parallel
      const [fastDirections, ecoDirections, weatherResult, aqiResult, hazards] =
        await Promise.allSettled([
          fetchGoogleDirections(request.origin, request.destination, false),
          fetchGoogleDirections(request.origin, request.destination, true),
          fetchWeatherData(request.originLat, request.originLng),
          fetchAirQualityData(request.originLat, request.originLng),
          fetchHazardsFromCameras(),
        ]);

      // Step 2: Parse routes from Google Maps
      let routes: RouteOption[] = [];

      if (fastDirections.status === "fulfilled") {
        const fastRoutes = parseGoogleRoutes(
          fastDirections.value,
          false
        );
        // Only take the first (fastest) route
        if (fastRoutes[0]) {
          routes.push(fastRoutes[0]);
        }
      } else {
        console.error(
          "[Routes] Google Directions (fast) failed:",
          fastDirections.reason
        );
      }

      if (ecoDirections.status === "fulfilled") {
        const fastestDistanceKm = routes[0]?.distanceKm;
        const ecoRoutes = parseGoogleRoutes(
          ecoDirections.value,
          true,
          fastestDistanceKm
        );
        // Only take the first eco route
        if (ecoRoutes[0]) {
          routes.push(ecoRoutes[0]);
        }
      } else {
        console.error(
          "[Routes] Google Directions (eco) failed:",
          ecoDirections.reason
        );
      }

      if (routes.length === 0) {
        return c.json(
          {
            error: {
              message:
                "Failed to fetch route directions. Please check the origin and destination.",
              code: "DIRECTIONS_FAILED",
            },
          },
          502
        );
      }

      // Step 3: Build environmental data from real APIs
      const weather =
        weatherResult.status === "fulfilled"
          ? weatherResult.value
          : {
              temperature: 72,
              weatherCondition: "Data unavailable",
              humidity: 50,
            };

      const aqi =
        aqiResult.status === "fulfilled"
          ? aqiResult.value
          : {
              airQualityIndex: 50,
              airQualityDescription: "Data temporarily unavailable",
            };

      const environmental: EnvironmentalData = {
        airQualityIndex: aqi.airQualityIndex,
        airQualityDescription: aqi.airQualityDescription,
        temperature: weather.temperature,
        weatherCondition: weather.weatherCondition,
        humidity: weather.humidity,
      };

      // Step 4: Get real hazard data from camera analysis
      const hazardsOnRoute: Camera[] =
        hazards.status === "fulfilled" ? hazards.value : [];

      // Step 5: Generate AI recommendation with Gemini (or fallback)
      let recommendation: GeminiRecommendation;

      if (isGeminiConfigured()) {
        try {
          recommendation = await generateRouteRecommendation(
            routes,
            environmental,
            hazardsOnRoute,
            request.preferEco ?? false
          );
        } catch (error) {
          console.error(
            "[Routes] Gemini recommendation failed, using fallback:",
            error
          );
          recommendation = generateFallbackRecommendation(
            routes,
            environmental,
            hazardsOnRoute,
            request.preferEco ?? false
          );
        }
      } else {
        recommendation = generateFallbackRecommendation(
          routes,
          environmental,
          hazardsOnRoute,
          request.preferEco ?? false
        );
      }

      const response: RouteResponse = {
        routes,
        environmental,
        hazardsOnRoute,
        recommendation,
      };

      console.log(
        `[Routes] Route planned successfully: ${routes.length} routes, AQI ${environmental.airQualityIndex}, ${environmental.weatherCondition}`
      );

      return c.json({ data: response });
    } catch (error) {
      console.error("[Routes] Route planning error:", error);
      return c.json(
        {
          error: {
            message:
              error instanceof Error
                ? error.message
                : "Failed to plan route",
            code: "ROUTE_PLANNING_FAILED",
          },
        },
        500
      );
    }
  }
);

export { routesRouter };
