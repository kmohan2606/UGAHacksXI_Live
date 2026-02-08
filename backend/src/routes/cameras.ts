import { Hono } from "hono";
import type {
  Camera,
  CameraStatus,
  HazardType,
  GeminiHazardAnalysis,
} from "../types";
import {
  analyzeTrafficCameraImage,
  isGeminiConfigured,
} from "../gemini";
import { getMockCameras, getMockHazardAnalysis } from "../mockData";

const camerasRouter = new Hono();

// GDOT ArcGIS API endpoint for real-time camera data
const GDOT_CAMERA_API =
  "https://rnhp.dot.ga.gov/hosting/rest/services/web_trafficcameras/MapServer/0/query";

// Atlanta metro counties to query
const ATLANTA_METRO_COUNTIES = [
  "Fulton",
  "DeKalb",
  "Cobb",
  "Gwinnett",
  "Clayton",
];

interface GDOTCameraAttributes {
  URL: string;
  DEVICE_NAME: string;
  DEVICE_DESCRIPTION: string;
  PRIMARY_ROAD: string;
  CROSS_ROAD_NAME: string;
  CITY_NAME: string | null;
  COUNTY_NAME: string;
  LATITUDE: number;
  LONGITUDE: number;
}

interface GDOTCameraFeature {
  attributes: GDOTCameraAttributes;
}

interface GDOTAPIResponse {
  features: GDOTCameraFeature[];
}

// Cache for camera data (refresh every 5 minutes)
let cameraCache: {
  data: Camera[];
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Store for hazard statuses (persists across requests)
const hazardStatuses: Map<string, CameraStatus> = new Map();

// Track background analysis state
let backgroundAnalysisInProgress = false;

/**
 * Returns the default "pending analysis" status for a camera
 */
function getDefaultStatus(): CameraStatus {
  return {
    hazard: false,
    type: "Clear",
    severity: 0,
    updatedAt: new Date().toISOString(),
    geminiExplanation:
      "Awaiting AI analysis. Click analyze or refresh to trigger real-time hazard detection.",
  };
}

/**
 * Get the current status for a camera (from cache or default)
 */
function getCameraStatus(camId: string): CameraStatus {
  return hazardStatuses.get(camId) ?? getDefaultStatus();
}

/**
 * Analyze a single camera with Gemini Vision and cache the result.
 * Falls back to mock analysis if Gemini fails or is not configured.
 */
async function analyzeSingleCamera(camera: Camera): Promise<CameraStatus> {
  let analysis: GeminiHazardAnalysis;

  // Try real Gemini analysis first
  if (isGeminiConfigured()) {
    try {
      analysis = await analyzeTrafficCameraImage(
        camera.imageUrl,
        camera.locationName
      );
    } catch (error) {
      console.warn(
        `[Cameras] Gemini analysis failed for ${camera.camId}, using mock:`,
        error
      );
      // Fallback to mock analysis
      analysis = getMockHazardAnalysis(camera.locationName);
    }
  } else {
    // Gemini not configured - use mock data
    console.log(`[Cameras] Gemini not configured, using mock for ${camera.camId}`);
    analysis = getMockHazardAnalysis(camera.locationName);
  }

  const status: CameraStatus = {
    hazard: analysis.hazard_detected,
    type: analysis.type,
    severity: analysis.severity,
    updatedAt: new Date().toISOString(),
    geminiExplanation: analysis.description,
  };

  hazardStatuses.set(camera.camId, status);

  // Update the cache entry too
  if (cameraCache) {
    const cachedCam = cameraCache.data.find(
      (c) => c.camId === camera.camId
    );
    if (cachedCam) {
      cachedCam.currentStatus = status;
    }
  }

  return status;
}

/**
 * Analyze all cameras in background batches using Gemini Vision
 */
async function analyzeAllCamerasInBackground(cameras: Camera[]) {
  if (backgroundAnalysisInProgress) {
    console.log("[Cameras] Background analysis already in progress, skipping");
    return;
  }

  if (!isGeminiConfigured()) {
    console.log("[Cameras] Gemini API not configured, skipping background analysis");
    return;
  }

  backgroundAnalysisInProgress = true;
  const BATCH_SIZE = 5;
  let analyzed = 0;
  let hazardsFound = 0;

  console.log(
    `[Cameras] Starting background Gemini analysis of ${cameras.length} cameras...`
  );

  for (let i = 0; i < cameras.length; i += BATCH_SIZE) {
    const batch = cameras.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((cam) => analyzeSingleCamera(cam))
    );

    for (const result of results) {
      analyzed++;
      if (result.status === "fulfilled" && result.value.hazard) {
        hazardsFound++;
      }
    }

    console.log(
      `[Cameras] Analyzed ${analyzed}/${cameras.length} cameras (${hazardsFound} hazards found)`
    );
  }

  backgroundAnalysisInProgress = false;
  console.log(
    `[Cameras] Background analysis complete: ${analyzed} cameras analyzed, ${hazardsFound} hazards detected`
  );
}

// Fetch cameras from GDOT API
async function fetchGDOTCameras(): Promise<Camera[]> {
  // Check cache first
  if (cameraCache && Date.now() - cameraCache.timestamp < CACHE_TTL_MS) {
    console.log("[Cameras] Returning cached camera data");
    return cameraCache.data;
  }

  console.log("[Cameras] Fetching fresh camera data from GDOT API");

  try {
    const countyFilter = ATLANTA_METRO_COUNTIES.map(
      (c) => `COUNTY_NAME='${c}'`
    ).join(" OR ");
    const params = new URLSearchParams({
      where: `ACTIVE=1 AND (${countyFilter})`,
      outFields:
        "URL,DEVICE_NAME,DEVICE_DESCRIPTION,PRIMARY_ROAD,CROSS_ROAD_NAME,CITY_NAME,COUNTY_NAME,LATITUDE,LONGITUDE",
      f: "json",
      resultRecordCount: "50",
    });

    const response = await fetch(`${GDOT_CAMERA_API}?${params}`);

    if (!response.ok) {
      throw new Error(`GDOT API returned ${response.status}`);
    }

    const data = (await response.json()) as GDOTAPIResponse;

    if (!data.features || data.features.length === 0) {
      console.log(
        "[Cameras] No cameras returned from GDOT API, using fallback"
      );
      return getFallbackCameras();
    }

    const cameras: Camera[] = data.features.map((feature) => {
      const attr = feature.attributes;
      const camId = attr.DEVICE_NAME.toLowerCase().replace(/[^a-z0-9]/g, "-");

      const locationName = attr.CITY_NAME
        ? `${attr.PRIMARY_ROAD} at ${attr.CROSS_ROAD_NAME} (${attr.CITY_NAME})`
        : `${attr.PRIMARY_ROAD} at ${attr.CROSS_ROAD_NAME}`;

      // Add timestamp to URL to prevent caching of stale images
      const imageUrl = `${attr.URL}?t=${Date.now()}`;

      return {
        camId,
        locationName,
        lat: attr.LATITUDE,
        lng: attr.LONGITUDE,
        imageUrl,
        currentStatus: getCameraStatus(camId),
      };
    });

    // Update cache
    cameraCache = {
      data: cameras,
      timestamp: Date.now(),
    };

    console.log(`[Cameras] Cached ${cameras.length} cameras from GDOT`);

    // Trigger background Gemini analysis (fire-and-forget)
    // Only if no statuses have been generated yet
    if (hazardStatuses.size === 0) {
      analyzeAllCamerasInBackground(cameras).catch((err) =>
        console.error("[Cameras] Background analysis error:", err)
      );
    }

    return cameras;
  } catch (error) {
    console.error("[Cameras] Error fetching from GDOT API:", error);
    return getFallbackCameras();
  }
}

// Fallback cameras in case GDOT API is unavailable
// Uses getMockCameras() which has realistic varied hazard data
function getFallbackCameras(): Camera[] {
  console.log("[Cameras] GDOT API unavailable, using mock camera data with varied hazards");
  return getMockCameras();
}

// ============================================
// Routes
// ============================================

// GET /api/cameras - Returns all monitored GDOT cameras with current hazard status
camerasRouter.get("/", async (c) => {
  const cameras = await fetchGDOTCameras();
  return c.json({ data: cameras });
});

// GET /api/cameras/refresh - Force refresh camera data and re-analyze with Gemini
camerasRouter.get("/refresh", async (c) => {
  // Clear cache to force refresh
  cameraCache = null;
  hazardStatuses.clear();

  const cameras = await fetchGDOTCameras();

  // Trigger fresh analysis
  analyzeAllCamerasInBackground(cameras).catch((err) =>
    console.error("[Cameras] Refresh analysis error:", err)
  );

  return c.json({
    data: cameras,
    message: `Refreshed ${cameras.length} cameras from GDOT. AI analysis running in background.`,
  });
});

// GET /api/cameras/hazards/active - Returns only cameras with active hazards
camerasRouter.get("/hazards/active", async (c) => {
  const cameras = await fetchGDOTCameras();
  const hazardCameras = cameras.filter(
    (cam) => cam.currentStatus.hazard && cam.currentStatus.severity >= 3
  );
  return c.json({
    data: hazardCameras,
    count: hazardCameras.length,
  });
});

// GET /api/cameras/proxy-image - Proxy camera images to avoid CORS/mixed-content issues
camerasRouter.get("/proxy-image", async (c) => {
  const url = c.req.query("url");
  if (!url) {
    return c.json(
      { error: { message: "Missing 'url' query parameter", code: "BAD_REQUEST" } },
      400
    );
  }

  try {
    // Strip query parameters from the GDOT image URL (server rejects cache busters)
    const cleanUrl = url.split("?")[0]!;

    const proc = Bun.spawn(
      ["curl", "-sL", "--max-time", "10", "-o", "-", cleanUrl],
      { stdout: "pipe", stderr: "pipe" }
    );

    const imageBuffer = await new Response(proc.stdout).arrayBuffer();
    await proc.exited;

    if (proc.exitCode !== 0 || imageBuffer.byteLength < 500) {
      return c.json(
        { error: { message: "Failed to fetch camera image", code: "FETCH_FAILED" } },
        502
      );
    }

    // Determine content type from URL extension
    const ext = cleanUrl.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : "image/jpeg";

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=15",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[Cameras] Image proxy error:", error);
    return c.json(
      { error: { message: "Image proxy error", code: "PROXY_ERROR" } },
      500
    );
  }
});

// GET /api/cameras/:camId - Returns a single camera's details and status
camerasRouter.get("/:camId", async (c) => {
  const camId = c.req.param("camId");
  const cameras = await fetchGDOTCameras();
  const camera = cameras.find((cam) => cam.camId === camId);

  if (!camera) {
    return c.json(
      { error: { message: "Camera not found", code: "CAMERA_NOT_FOUND" } },
      404
    );
  }

  return c.json({ data: camera });
});

// POST /api/cameras/:camId/analyze - Triggers real Gemini Vision analysis on a camera
camerasRouter.post("/:camId/analyze", async (c) => {
  const camId = c.req.param("camId");
  const cameras = await fetchGDOTCameras();
  const camera = cameras.find((cam) => cam.camId === camId);

  if (!camera) {
    return c.json(
      { error: { message: "Camera not found", code: "CAMERA_NOT_FOUND" } },
      404
    );
  }

  if (!isGeminiConfigured()) {
    return c.json(
      {
        error: {
          message: "Gemini API key not configured",
          code: "API_NOT_CONFIGURED",
        },
      },
      503
    );
  }

  try {
    console.log(
      `[Cameras] Running Gemini analysis for ${camId}: ${camera.locationName}`
    );

    const analysis = await analyzeTrafficCameraImage(
      camera.imageUrl,
      camera.locationName
    );

    // Update cached status with real analysis
    const newStatus: CameraStatus = {
      hazard: analysis.hazard_detected,
      type: analysis.type,
      severity: analysis.severity,
      updatedAt: new Date().toISOString(),
      geminiExplanation: analysis.description,
    };

    hazardStatuses.set(camId, newStatus);

    // Also update the cache
    if (cameraCache) {
      const cachedCam = cameraCache.data.find((c) => c.camId === camId);
      if (cachedCam) {
        cachedCam.currentStatus = newStatus;
      }
    }

    console.log(
      `[Cameras] Gemini analysis complete for ${camId}: ${analysis.type} (severity: ${analysis.severity}, confidence: ${analysis.confidence})`
    );

    return c.json({
      data: {
        camId,
        analysis,
        updatedStatus: newStatus,
      },
    });
  } catch (error) {
    console.error(`[Cameras] Gemini analysis error for ${camId}:`, error);
    return c.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to analyze camera image",
          code: "ANALYSIS_FAILED",
        },
      },
      500
    );
  }
});

export { camerasRouter };
