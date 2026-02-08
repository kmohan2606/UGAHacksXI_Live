/**
 * Mock Data Generators for Graceful API Fallbacks
 * 
 * Each function provides realistic mock data when the corresponding API fails.
 * This ensures the app remains functional even without API keys.
 */

import type {
    Camera,
    CameraStatus,
    HazardType,
    GeminiHazardAnalysis,
    GeminiRecommendation,
    GeminiScoutVerification,
    RouteOption,
    EnvironmentalData,
    ReportType,
} from "./types";

// ==========================================
// Mock Camera Data (GDOT Fallback)
// ==========================================

const MOCK_CAMERA_DATA: Array<{
    camId: string;
    locationName: string;
    lat: number;
    lng: number;
    hazardType: HazardType;
    severity: number;
    explanation: string;
}> = [
        {
            camId: "mock-cam-001",
            locationName: "I-285 at Peachtree Industrial Blvd (Dunwoody)",
            lat: 33.9425,
            lng: -84.3298,
            hazardType: "Clear",
            severity: 0,
            explanation: "Traffic flowing normally. No incidents detected.",
        },
        {
            camId: "mock-cam-002",
            locationName: "I-75 S at Howell Mill Rd (Midtown)",
            lat: 33.8011,
            lng: -84.4107,
            hazardType: "Crash",
            severity: 7,
            explanation: "Multi-vehicle collision blocking right two lanes. Emergency responders on scene.",
        },
        {
            camId: "mock-cam-003",
            locationName: "I-85 N at Clairmont Rd (Brookhaven)",
            lat: 33.8756,
            lng: -84.3349,
            hazardType: "Clear",
            severity: 0,
            explanation: "Light traffic. All lanes open.",
        },
        {
            camId: "mock-cam-004",
            locationName: "I-20 W at Moreland Ave (East Atlanta)",
            lat: 33.7392,
            lng: -84.3507,
            hazardType: "Debris",
            severity: 4,
            explanation: "Debris reported in right lane. Proceed with caution.",
        },
        {
            camId: "mock-cam-005",
            locationName: "GA-400 N at Lenox Rd (Buckhead)",
            lat: 33.8493,
            lng: -84.3627,
            hazardType: "Clear",
            severity: 0,
            explanation: "Normal traffic conditions. No hazards detected.",
        },
        {
            camId: "mock-cam-006",
            locationName: "I-285 W at Roswell Rd (Sandy Springs)",
            lat: 33.9311,
            lng: -84.3541,
            hazardType: "Construction",
            severity: 3,
            explanation: "Lane closure for construction. Expect minor delays.",
        },
        {
            camId: "mock-cam-007",
            locationName: "I-75 N at 14th St (Atlantic Station)",
            lat: 33.7869,
            lng: -84.3988,
            hazardType: "Stall",
            severity: 5,
            explanation: "Stalled vehicle on right shoulder. Slow traffic in right lane.",
        },
        {
            camId: "mock-cam-008",
            locationName: "I-20 E at Boulevard (Downtown)",
            lat: 33.7485,
            lng: -84.3733,
            hazardType: "Clear",
            severity: 0,
            explanation: "Traffic moving smoothly in all lanes.",
        },
        {
            camId: "mock-cam-009",
            locationName: "I-85 S at Jimmy Carter Blvd (Norcross)",
            lat: 33.9283,
            lng: -84.2124,
            hazardType: "Weather",
            severity: 6,
            explanation: "Reduced visibility due to fog. Drive carefully.",
        },
        {
            camId: "mock-cam-010",
            locationName: "I-675 N at Ellenwood Rd (Clayton)",
            lat: 33.6231,
            lng: -84.2896,
            hazardType: "Clear",
            severity: 0,
            explanation: "No incidents. Traffic is light.",
        },
        {
            camId: "mock-cam-011",
            locationName: "Connector at 10th St (Midtown)",
            lat: 33.7815,
            lng: -84.3853,
            hazardType: "Flood",
            severity: 8,
            explanation: "Standing water in underpass. Right lane impassable.",
        },
        {
            camId: "mock-cam-012",
            locationName: "I-285 at Camp Creek Pkwy (South Fulton)",
            lat: 33.6378,
            lng: -84.4951,
            hazardType: "Clear",
            severity: 0,
            explanation: "All clear. Normal traffic flow.",
        },
    ];

/**
 * Get mock camera data with realistic variety of hazards
 */
export function getMockCameras(): Camera[] {
    const now = new Date().toISOString();

    return MOCK_CAMERA_DATA.map((cam) => ({
        camId: cam.camId,
        locationName: cam.locationName,
        lat: cam.lat,
        lng: cam.lng,
        imageUrl: `http://navigator-c2c.dot.ga.gov/snapshots/GDOT-CCTV-MOCK.jpg?t=${Date.now()}`,
        currentStatus: {
            hazard: cam.hazardType !== "Clear",
            type: cam.hazardType,
            severity: cam.severity,
            updatedAt: now,
            geminiExplanation: cam.explanation,
        },
    }));
}

// ==========================================
// Mock Gemini Analysis (AI Fallback)
// ==========================================

const MOCK_HAZARD_POOL: Array<{
    type: HazardType;
    severity: number;
    description: string;
}> = [
        { type: "Clear", severity: 0, description: "Traffic appears normal with good visibility. No hazards detected." },
        { type: "Clear", severity: 0, description: "Light traffic flow. All lanes clear." },
        { type: "Crash", severity: 6, description: "Minor fender-bender visible in right lane. Traffic slowing." },
        { type: "Stall", severity: 4, description: "Disabled vehicle on shoulder. No lane blockage." },
        { type: "Debris", severity: 3, description: "Small debris visible in roadway. Use caution." },
        { type: "Construction", severity: 2, description: "Active work zone with proper signage. Expect delays." },
        { type: "Weather", severity: 5, description: "Wet road conditions. Reduced visibility." },
    ];

/**
 * Get mock Gemini hazard analysis - randomly selects from pool
 * Weighted towards "Clear" for realism (most cameras are clear most of the time)
 */
export function getMockHazardAnalysis(locationName: string): GeminiHazardAnalysis {
    // 70% chance of clear, 30% chance of hazard
    const isClear = Math.random() < 0.7;

    if (isClear) {
        return {
            hazard_detected: false,
            type: "Clear",
            severity: 0,
            description: `Traffic at ${locationName} appears normal. No hazards detected.`,
            confidence: 0.92,
        };
    }

    // Pick a random hazard
    const hazardOptions = MOCK_HAZARD_POOL.filter(h => h.type !== "Clear");
    const hazard = hazardOptions[Math.floor(Math.random() * hazardOptions.length)]!;

    return {
        hazard_detected: true,
        type: hazard.type,
        severity: hazard.severity,
        description: hazard.description,
        confidence: 0.85,
    };
}

// ==========================================
// Mock Weather Data (OpenWeatherMap Fallback)
// ==========================================

const MOCK_WEATHER_CONDITIONS = [
    { condition: "Clear Sky", temp: 72, humidity: 45 },
    { condition: "Partly Cloudy", temp: 68, humidity: 55 },
    { condition: "Scattered Clouds", temp: 65, humidity: 60 },
    { condition: "Light Rain", temp: 58, humidity: 78 },
    { condition: "Overcast", temp: 62, humidity: 65 },
];

/**
 * Get mock weather data with reasonable Atlanta conditions
 */
export function getMockWeather(): { temperature: number; weatherCondition: string; humidity: number } {
    const weather = MOCK_WEATHER_CONDITIONS[Math.floor(Math.random() * MOCK_WEATHER_CONDITIONS.length)]!;
    return {
        temperature: weather.temp,
        weatherCondition: weather.condition,
        humidity: weather.humidity,
    };
}

// ==========================================
// Mock AQI Data (AirNow Fallback)
// ==========================================

const MOCK_AQI_LEVELS = [
    { aqi: 32, description: "Good - Air quality is satisfactory" },
    { aqi: 48, description: "Good - Air quality is satisfactory" },
    { aqi: 65, description: "Moderate - Acceptable but may affect sensitive groups" },
    { aqi: 78, description: "Moderate - Acceptable but may affect sensitive groups" },
    { aqi: 95, description: "Moderate - Acceptable but may affect sensitive groups" },
];

/**
 * Get mock AQI data with typical Atlanta values
 */
export function getMockAirQuality(): { airQualityIndex: number; airQualityDescription: string } {
    const aqi = MOCK_AQI_LEVELS[Math.floor(Math.random() * MOCK_AQI_LEVELS.length)]!;
    return {
        airQualityIndex: aqi.aqi,
        airQualityDescription: aqi.description,
    };
}

// ==========================================
// Mock Route Data (Google Directions Fallback)
// ==========================================

/**
 * Generate mock route options for a given trip
 */
export function getMockRoutes(origin: string, destination: string): RouteOption[] {
    // Simple polyline for Atlanta area (encoded)
    const mockPolyline = "a~l~Fjk~uOwHJy@P";

    return [
        {
            id: "route-fast-0",
            name: `Fastest via I-85`,
            distanceKm: 18.5,
            durationMinutes: 22,
            isEcoFriendly: false,
            isHazardAvoiding: false,
            co2SavedKg: 0,
            co2Kg: 3.89,
            hazardExposureScore: 15,
            polyline: mockPolyline,
            steps: [
                { instruction: `Head northeast on ${origin.split(",")[0]}`, distanceKm: 0.5, durationMinutes: 2 },
                { instruction: "Merge onto I-85 N", distanceKm: 12.0, durationMinutes: 12 },
                { instruction: "Take exit toward destination", distanceKm: 3.0, durationMinutes: 5 },
                { instruction: `Arrive at ${destination.split(",")[0]}`, distanceKm: 3.0, durationMinutes: 3 },
            ],
        },
        {
            id: "route-eco-0",
            name: `Eco-Friendly via local roads`,
            distanceKm: 16.2,
            durationMinutes: 28,
            isEcoFriendly: true,
            isHazardAvoiding: false,
            co2SavedKg: 0.58,
            co2Kg: 2.75,
            hazardExposureScore: 8,
            polyline: mockPolyline,
            steps: [
                { instruction: `Head northeast on ${origin.split(",")[0]}`, distanceKm: 0.5, durationMinutes: 2 },
                { instruction: "Continue on Peachtree Rd", distanceKm: 8.0, durationMinutes: 15 },
                { instruction: "Turn right onto destination road", distanceKm: 4.7, durationMinutes: 8 },
                { instruction: `Arrive at ${destination.split(",")[0]}`, distanceKm: 3.0, durationMinutes: 3 },
            ],
        },
    ];
}

// ==========================================
// Mock Route Recommendation (Gemini Fallback)
// ==========================================

/**
 * Generate mock AI route recommendation
 */
export function getMockRouteRecommendation(
    routes: RouteOption[],
    environmental: EnvironmentalData,
    preferEco: boolean
): GeminiRecommendation {
    const recommendedRoute = preferEco
        ? routes.find(r => r.isEcoFriendly) || routes[0]!
        : routes[0]!;

    const ecoRoute = routes.find(r => r.isEcoFriendly);
    const co2Saved = ecoRoute?.co2SavedKg ?? 0;

    return {
        recommendedRouteId: recommendedRoute.id,
        reasoning: preferEco
            ? `The eco-friendly route is recommended, saving approximately ${co2Saved}kg of CO2 emissions. Current air quality is ${environmental.airQualityDescription.toLowerCase()} with an AQI of ${environmental.airQualityIndex}. Weather conditions are favorable for travel.`
            : `The fastest route via highway is recommended given current traffic conditions. Estimated CO2 emissions: ${recommendedRoute.co2Kg}kg. Air quality is ${environmental.airQualityDescription.toLowerCase()}.`,
        healthAdvisory: environmental.airQualityIndex > 100
            ? "Air quality is unhealthy. Consider limiting outdoor exposure."
            : undefined,
        safetyScore: 85 - (recommendedRoute.hazardExposureScore ?? 0),
        ecoScore: recommendedRoute.isEcoFriendly ? 88 : 45,
    };
}

// ==========================================
// Mock Scout Verification (Gemini Fallback)
// ==========================================

/**
 * Generate mock AI verification for scout reports
 */
export function getMockScoutVerification(reportType: ReportType): GeminiScoutVerification {
    // 80% chance of verification for demo purposes
    const isVerified = Math.random() < 0.8;

    const typeLabels: Record<ReportType, string> = {
        broken_charger: "broken EV charger",
        blocked_bike_lane: "blocked bike lane",
        pothole: "pothole",
        flooding: "flooding",
        obstruction: "road obstruction",
        other: "reported issue",
    };

    return {
        verified: isVerified,
        detected_issue: isVerified ? reportType : undefined,
        explanation: isVerified
            ? `Image analysis confirms the presence of a ${typeLabels[reportType]}. Thank you for your report.`
            : `Unable to confirm the reported ${typeLabels[reportType]} from the image. Please try submitting a clearer photo.`,
        confidence: isVerified ? 0.87 : 0.45,
    };
}
