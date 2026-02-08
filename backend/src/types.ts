import { z } from "zod";

// ==========================================
// GDOT Camera & Hazard Detection Types
// ==========================================

export const HazardTypeSchema = z.enum([
  "Flood",
  "Fire",
  "Crash",
  "Stall",
  "Debris",
  "Construction",
  "Weather",
  "Clear",
]);

export type HazardType = z.infer<typeof HazardTypeSchema>;

export const CameraStatusSchema = z.object({
  hazard: z.boolean(),
  type: HazardTypeSchema,
  severity: z.number().min(0).max(10),
  updatedAt: z.string().datetime(),
  geminiExplanation: z.string(),
});

export type CameraStatus = z.infer<typeof CameraStatusSchema>;

export const CameraSchema = z.object({
  camId: z.string(),
  locationName: z.string(),
  lat: z.number(),
  lng: z.number(),
  imageUrl: z.string().url(),
  currentStatus: CameraStatusSchema,
});

export type Camera = z.infer<typeof CameraSchema>;

export const CamerasResponseSchema = z.array(CameraSchema);

// ==========================================
// Community Reports (Scout Mode)
// ==========================================

export const ReportTypeSchema = z.enum([
  "broken_charger",
  "blocked_bike_lane",
  "pothole",
  "flooding",
  "obstruction",
  "other",
]);

export type ReportType = z.infer<typeof ReportTypeSchema>;

export const CommunityReportSchema = z.object({
  reportId: z.string(),
  type: ReportTypeSchema,
  description: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  imageUrl: z.string().url().optional(),
  verifiedByAi: z.boolean(),
  aiExplanation: z.string().optional(),
  timestamp: z.string().datetime(),
  status: z.enum(["pending", "verified", "resolved"]),
});

export type CommunityReport = z.infer<typeof CommunityReportSchema>;

export const CreateReportRequestSchema = z.object({
  type: ReportTypeSchema,
  description: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  imageBase64: z.string().optional(),
});

export type CreateReportRequest = z.infer<typeof CreateReportRequestSchema>;

// ==========================================
// Unified Hazard Point (cameras + community reports)
// ==========================================

export const HazardPointSchema = z.object({
  id: z.string(),
  lat: z.number(),
  lng: z.number(),
  type: z.string(),
  severity: z.number().min(0).max(10),
  description: z.string(),
  source: z.enum(["camera", "report"]),
});

export type HazardPoint = z.infer<typeof HazardPointSchema>;

export const NearbyHazardSchema = HazardPointSchema.extend({
  distanceMeters: z.number(),
});

export type NearbyHazard = z.infer<typeof NearbyHazardSchema>;

// ==========================================
// Route Planning Types
// ==========================================

export const RouteOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  distanceKm: z.number(),
  durationMinutes: z.number(),
  isEcoFriendly: z.boolean(),
  isHazardAvoiding: z.boolean().optional(),
  co2SavedKg: z.number().optional(),
  co2Kg: z.number().optional(),
  hazardExposureScore: z.number().min(0).max(100).optional(),
  nearbyHazards: z.array(NearbyHazardSchema).optional(),
  polyline: z.string(),
  steps: z.array(
    z.object({
      instruction: z.string(),
      distanceKm: z.number(),
      durationMinutes: z.number(),
    })
  ),
});

export type RouteOption = z.infer<typeof RouteOptionSchema>;

export const EnvironmentalDataSchema = z.object({
  airQualityIndex: z.number(),
  airQualityDescription: z.string(),
  temperature: z.number(),
  weatherCondition: z.string(),
  humidity: z.number(),
  uvIndex: z.number().optional(),
});

export type EnvironmentalData = z.infer<typeof EnvironmentalDataSchema>;

export const RouteRequestSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  destLat: z.number().optional(),
  destLng: z.number().optional(),
  preferEco: z.boolean().optional().default(false),
  avoidHazards: z.boolean().optional().default(true),
});

export type RouteRequest = z.infer<typeof RouteRequestSchema>;

export const GeminiRecommendationSchema = z.object({
  recommendedRouteId: z.string(),
  reasoning: z.string(),
  healthAdvisory: z.string().optional(),
  safetyScore: z.number().min(0).max(100),
  ecoScore: z.number().min(0).max(100),
});

export type GeminiRecommendation = z.infer<typeof GeminiRecommendationSchema>;

export const RouteResponseSchema = z.object({
  routes: z.array(RouteOptionSchema),
  environmental: EnvironmentalDataSchema,
  hazardsOnRoute: z.array(HazardPointSchema),
  recommendation: GeminiRecommendationSchema,
});

export type RouteResponse = z.infer<typeof RouteResponseSchema>;

// ==========================================
// Gemini Analysis Types
// ==========================================

export const GeminiHazardAnalysisSchema = z.object({
  hazard_detected: z.boolean(),
  type: HazardTypeSchema,
  severity: z.number().min(0).max(10),
  description: z.string(),
  confidence: z.number().min(0).max(1),
});

export type GeminiHazardAnalysis = z.infer<typeof GeminiHazardAnalysisSchema>;

export const GeminiScoutVerificationSchema = z.object({
  verified: z.boolean(),
  detected_issue: ReportTypeSchema.optional(),
  explanation: z.string(),
  confidence: z.number().min(0).max(1),
});

export type GeminiScoutVerification = z.infer<typeof GeminiScoutVerificationSchema>;
