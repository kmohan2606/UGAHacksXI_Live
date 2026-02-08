import { tmpdir } from "os";
import { join } from "path";
import { writeFileSync, unlinkSync } from "fs";
import type {
  GeminiHazardAnalysis,
  GeminiScoutVerification,
  GeminiRecommendation,
  RouteOption,
  EnvironmentalData,
  Camera,
  HazardType,
  ReportType,
} from "./types";

/**
 * Parse JSON from Gemini response text, handling markdown code blocks
 */
function parseJsonFromResponse(text: string): any {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // Try extracting from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]!.trim());
    } catch {}
  }

  // Try finding a JSON object in the text
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]!);
    } catch {}
  }

  throw new Error("Failed to parse JSON from Gemini response");
}

/**
 * Call the Gemini API directly via curl to bypass the Vibecode proxy.
 * Supports both text-only and multimodal (text + image) requests.
 */
async function callGeminiAPI(
  parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  };

  // Write request body to a temp file (needed for large base64 payloads)
  const tempFile = join(tmpdir(), `gemini-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(tempFile, JSON.stringify(requestBody));

  try {
    const proc = Bun.spawn(
      [
        "curl",
        "-sL",
        "--max-time",
        "60",
        "-X",
        "POST",
        "-H",
        "Content-Type: application/json",
        "-d",
        `@${tempFile}`,
        url,
      ],
      { stdout: "pipe", stderr: "pipe" }
    );

    const output = await new Response(proc.stdout).text();
    await proc.exited;

    // Clean up temp file
    try {
      unlinkSync(tempFile);
    } catch {}

    if (proc.exitCode !== 0) {
      throw new Error(`Gemini API curl failed with exit code ${proc.exitCode}`);
    }

    const response = JSON.parse(output);

    if (response.error) {
      throw new Error(
        `Gemini API error: ${response.error.message || JSON.stringify(response.error)}`
      );
    }

    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error(
        `Gemini API returned no text content: ${JSON.stringify(response).slice(0, 200)}`
      );
    }

    return text;
  } catch (error) {
    // Clean up temp file on error
    try {
      unlinkSync(tempFile);
    } catch {}
    throw error;
  }
}

/**
 * Fetch an image from a URL and return it as base64.
 * Uses child process curl to bypass the Vibecode proxy.
 * Strips query parameters since the GDOT image server rejects them.
 */
async function fetchImageAsBase64(
  url: string
): Promise<{ data: string; mimeType: string } | null> {
  try {
    // Strip query parameters - GDOT image server rejects URLs with ?t= cache busters
    const cleanUrl = url.split("?")[0]!;

    const proc = Bun.spawn(
      ["curl", "-sL", "--max-time", "15", "-o", "-", cleanUrl],
      { stdout: "pipe", stderr: "pipe" }
    );

    const output = await new Response(proc.stdout).arrayBuffer();
    await proc.exited;

    if (proc.exitCode !== 0 || output.byteLength < 1000) {
      console.error(
        `[Gemini] Image fetch failed for ${cleanUrl} (exit: ${proc.exitCode}, size: ${output.byteLength})`
      );
      return null;
    }

    const base64 = Buffer.from(output).toString("base64");
    return { data: base64, mimeType: "image/jpeg" };
  } catch (error) {
    console.error(`[Gemini] Failed to fetch image from ${url}:`, error);
    return null;
  }
}

/**
 * Analyze a traffic camera image using Gemini Vision to detect hazards
 */
export async function analyzeTrafficCameraImage(
  imageUrl: string,
  locationName: string
): Promise<GeminiHazardAnalysis> {
  const imageData = await fetchImageAsBase64(imageUrl);
  if (!imageData) {
    throw new Error("Failed to fetch camera image for analysis");
  }

  const prompt = `You are a traffic safety analyst AI. Analyze this traffic camera image from "${locationName}" in Atlanta, Georgia and detect any hazards or incidents.

Respond ONLY with a valid JSON object (no markdown fences, no extra text):
{
  "hazard_detected": boolean,
  "type": "Flood" | "Fire" | "Crash" | "Stall" | "Debris" | "Construction" | "Weather" | "Clear",
  "severity": number (0-10),
  "description": "1-2 sentence description of what you see",
  "confidence": number (0.0-1.0)
}

Rules:
- If the image is dark/nighttime but no hazards visible, mark as "Clear" with severity 0.
- If the image shows normal traffic flow, mark as "Clear" with severity 0.
- severity: 0 = no issue, 1-3 = minor, 4-6 = moderate, 7-10 = severe.
- "type" must be exactly one of: Flood, Fire, Crash, Stall, Debris, Construction, Weather, Clear.
- Be accurate and conservative. Only flag real hazards.`;

  const text = await callGeminiAPI([
    { text: prompt },
    { inline_data: { mime_type: imageData.mimeType, data: imageData.data } },
  ]);

  const parsed = parseJsonFromResponse(text);

  const validTypes: HazardType[] = [
    "Flood",
    "Fire",
    "Crash",
    "Stall",
    "Debris",
    "Construction",
    "Weather",
    "Clear",
  ];
  const parsedType = validTypes.includes(parsed.type) ? parsed.type : "Clear";

  return {
    hazard_detected: Boolean(parsed.hazard_detected),
    type: parsedType,
    severity: Math.min(10, Math.max(0, Number(parsed.severity) || 0)),
    description: String(parsed.description || "Analysis complete."),
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
  };
}

/**
 * Generate an intelligent route recommendation using Gemini
 */
export async function generateRouteRecommendation(
  routes: RouteOption[],
  environmental: EnvironmentalData,
  hazards: Camera[],
  preferEco: boolean
): Promise<GeminiRecommendation> {
  const routeSummary = routes.map((r) => ({
    id: r.id,
    name: r.name,
    distanceKm: r.distanceKm,
    durationMinutes: r.durationMinutes,
    isEcoFriendly: r.isEcoFriendly,
    co2SavedKg: r.co2SavedKg,
  }));

  const hazardSummary = hazards
    .filter((h) => h.currentStatus.hazard)
    .map((h) => ({
      location: h.locationName,
      type: h.currentStatus.type,
      severity: h.currentStatus.severity,
      description: h.currentStatus.geminiExplanation,
    }));

  const prompt = `You are GreenCommute AI, an intelligent commute advisor for Atlanta, Georgia. Based on the following real-time data, recommend the best route.

Available Routes:
${JSON.stringify(routeSummary, null, 2)}

Current Environmental Conditions:
- Air Quality Index: ${environmental.airQualityIndex} (${environmental.airQualityDescription})
- Temperature: ${environmental.temperature}°F
- Weather: ${environmental.weatherCondition}
- Humidity: ${environmental.humidity}%
${environmental.uvIndex ? `- UV Index: ${environmental.uvIndex}` : ""}

Active Hazards Along Routes:
${hazardSummary.length > 0 ? JSON.stringify(hazardSummary, null, 2) : "None currently detected"}

User Preference: ${preferEco ? "User prefers eco-friendly routes" : "No specific preference (optimize for speed and safety)"}

Respond ONLY with a valid JSON object (no markdown fences, no extra text):
{
  "recommendedRouteId": "the id of the recommended route from the list above",
  "reasoning": "2-3 detailed sentences explaining your recommendation, referencing specific real-time conditions like weather, AQI, hazards, and CO2 savings",
  "healthAdvisory": "health advisory string if AQI > 100 or extreme weather conditions, otherwise null",
  "safetyScore": number (0-100, based on hazards and conditions),
  "ecoScore": number (0-100, based on environmental impact of the route)
}`;

  const text = await callGeminiAPI([{ text: prompt }]);
  const parsed = parseJsonFromResponse(text);

  const validRouteIds = routes.map((r) => r.id);
  const recommendedId = validRouteIds.includes(parsed.recommendedRouteId)
    ? parsed.recommendedRouteId
    : routes[0]?.id ?? "unknown";

  return {
    recommendedRouteId: recommendedId,
    reasoning: String(
      parsed.reasoning || "Unable to generate detailed recommendation."
    ),
    healthAdvisory: parsed.healthAdvisory || undefined,
    safetyScore: Math.min(
      100,
      Math.max(0, Number(parsed.safetyScore) || 50)
    ),
    ecoScore: Math.min(100, Math.max(0, Number(parsed.ecoScore) || 50)),
  };
}

/**
 * Verify a community report image using Gemini Vision
 */
export async function verifyReportImage(
  reportType: ReportType,
  imageBase64: string
): Promise<GeminiScoutVerification> {
  const reportTypeLabels: Record<ReportType, string> = {
    broken_charger: "broken or damaged EV charging station",
    blocked_bike_lane: "blocked or obstructed bike lane",
    pothole: "pothole or road surface damage",
    flooding: "flooding or standing water on the road",
    obstruction: "road or path obstruction",
    other: "general infrastructure issue",
  };

  const issueDescription = reportTypeLabels[reportType] || "reported issue";

  const prompt = `You are verifying a community infrastructure report. The user reported a "${issueDescription}". Analyze this image and determine if the reported issue is actually present.

Respond ONLY with a valid JSON object (no markdown fences, no extra text):
{
  "verified": boolean,
  "detected_issue": "${reportType}" if verified or null if not,
  "explanation": "1-2 clear sentences explaining what you see in the image and whether it matches the reported issue",
  "confidence": number (0.0-1.0)
}

Be fair but accurate. If the image clearly shows the reported issue, verify it. If the image is unclear or doesn't show the issue, mark as not verified.`;

  const text = await callGeminiAPI([
    { text: prompt },
    { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
  ]);

  const parsed = parseJsonFromResponse(text);

  return {
    verified: Boolean(parsed.verified),
    detected_issue: parsed.verified ? reportType : undefined,
    explanation: String(parsed.explanation || "Analysis complete."),
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
  };
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY?.trim();
}
