/**
 * Geo utilities for route planning:
 *  - Google polyline decoding
 *  - Haversine distance
 *  - Nearby-hazard detection
 *  - Avoidance waypoint generation
 */

export interface LatLng {
  lat: number;
  lng: number;
}

// ==========================================
// Polyline Decoder (Google encoding format)
// ==========================================

/**
 * Decode an encoded polyline string into an array of lat/lng points.
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    // Decode longitude
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

// ==========================================
// Haversine Distance
// ==========================================

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate distance in meters between two lat/lng points using the Haversine formula.
 */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

// ==========================================
// Nearby Hazard Detection
// ==========================================

export interface HazardPoint {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity: number;
  description: string;
  source: "camera" | "report";
}

export interface NearbyHazard extends HazardPoint {
  distanceMeters: number;
}

/**
 * Find all hazards within `radiusMeters` of any point on the decoded polyline.
 * For performance, samples every Nth point on the polyline (adaptive to length).
 */
export function findNearbyHazards(
  polylinePoints: LatLng[],
  hazards: HazardPoint[],
  radiusMeters: number = 500
): NearbyHazard[] {
  if (polylinePoints.length === 0 || hazards.length === 0) return [];

  // Sample polyline points: every ~100m or at least every 5th point
  const step = Math.max(1, Math.floor(polylinePoints.length / 200));
  const sampledPoints: LatLng[] = [];
  for (let i = 0; i < polylinePoints.length; i += step) {
    sampledPoints.push(polylinePoints[i]!);
  }
  // Always include the last point
  const lastPoint = polylinePoints[polylinePoints.length - 1];
  if (lastPoint && sampledPoints[sampledPoints.length - 1] !== lastPoint) {
    sampledPoints.push(lastPoint);
  }

  const nearbyMap = new Map<string, NearbyHazard>();

  for (const hazard of hazards) {
    const hazardLoc: LatLng = { lat: hazard.lat, lng: hazard.lng };
    let minDistance = Infinity;

    for (const point of sampledPoints) {
      const dist = haversineDistance(point, hazardLoc);
      if (dist < minDistance) {
        minDistance = dist;
      }
      // Early exit: already within radius, no need to check further
      if (minDistance < radiusMeters * 0.5) break;
    }

    if (minDistance <= radiusMeters) {
      nearbyMap.set(hazard.id, {
        ...hazard,
        distanceMeters: Math.round(minDistance),
      });
    }
  }

  return Array.from(nearbyMap.values()).sort(
    (a, b) => a.distanceMeters - b.distanceMeters
  );
}

// ==========================================
// Avoidance Waypoint Generation
// ==========================================

/**
 * Given a point on the route (closest to the hazard) and the hazard location,
 * generate a waypoint that steers the route ~1km away from the hazard,
 * perpendicular to the route direction at that point.
 *
 * @param routePointBefore - The route point before the closest point to hazard
 * @param routePointAfter - The route point after the closest point to hazard
 * @param hazardPoint - The hazard location
 * @param offsetMeters - How far to offset (default 1500m)
 * @returns A waypoint that steers the route away from the hazard
 */
export function generateAvoidanceWaypoint(
  routePointBefore: LatLng,
  routePointAfter: LatLng,
  hazardPoint: LatLng,
  offsetMeters: number = 1500
): LatLng {
  // Route direction vector
  const routeDLat = routePointAfter.lat - routePointBefore.lat;
  const routeDLng = routePointAfter.lng - routePointBefore.lng;

  // Perpendicular vector (rotate 90 degrees)
  const perpLat = -routeDLng;
  const perpLng = routeDLat;

  // Normalize the perpendicular vector
  const perpLen = Math.sqrt(perpLat * perpLat + perpLng * perpLng);
  if (perpLen === 0) {
    // Route points are identical; offset directly away from hazard
    const midLat = (routePointBefore.lat + routePointAfter.lat) / 2;
    const midLng = (routePointBefore.lng + routePointAfter.lng) / 2;
    const awayLat = midLat - hazardPoint.lat;
    const awayLng = midLng - hazardPoint.lng;
    const awayLen = Math.sqrt(awayLat * awayLat + awayLng * awayLng);
    if (awayLen === 0) {
      return { lat: midLat + 0.01, lng: midLng + 0.01 };
    }
    const degOffset = offsetMeters / 111_000;
    return {
      lat: midLat + (awayLat / awayLen) * degOffset,
      lng: midLng + (awayLng / awayLen) * degOffset,
    };
  }

  const normPerpLat = perpLat / perpLen;
  const normPerpLng = perpLng / perpLen;

  // Midpoint of the route segment (where the waypoint will be placed)
  const midLat = (routePointBefore.lat + routePointAfter.lat) / 2;
  const midLng = (routePointBefore.lng + routePointAfter.lng) / 2;

  // Determine which side of the route the hazard is on
  // If the hazard is on the "positive perpendicular" side, we go "negative" and vice versa
  const toHazardLat = hazardPoint.lat - midLat;
  const toHazardLng = hazardPoint.lng - midLng;
  const dotProduct = toHazardLat * normPerpLat + toHazardLng * normPerpLng;

  // Go to the opposite side of the hazard
  const direction = dotProduct >= 0 ? -1 : 1;

  // Convert meters to approximate degrees (1 degree ≈ 111km at equator)
  const degOffset = offsetMeters / 111_000;

  return {
    lat: midLat + direction * normPerpLat * degOffset,
    lng: midLng + direction * normPerpLng * degOffset,
  };
}

/**
 * Given a decoded route polyline and a list of nearby hazards, generate
 * avoidance waypoints for each hazard.
 */
export function generateAvoidanceWaypoints(
  polylinePoints: LatLng[],
  nearbyHazards: NearbyHazard[],
  offsetMeters: number = 1500
): LatLng[] {
  if (polylinePoints.length < 2 || nearbyHazards.length === 0) return [];

  const waypoints: LatLng[] = [];

  for (const hazard of nearbyHazards) {
    const hazardLoc: LatLng = { lat: hazard.lat, lng: hazard.lng };

    // Find the closest point index on the polyline to this hazard
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < polylinePoints.length; i++) {
      const dist = haversineDistance(polylinePoints[i]!, hazardLoc);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }

    // Get the route segment around the closest point
    const beforeIdx = Math.max(0, closestIdx - 1);
    const afterIdx = Math.min(polylinePoints.length - 1, closestIdx + 1);

    const waypoint = generateAvoidanceWaypoint(
      polylinePoints[beforeIdx]!,
      polylinePoints[afterIdx]!,
      hazardLoc,
      offsetMeters
    );

    waypoints.push(waypoint);
  }

  return waypoints;
}

/**
 * Calculate a hazard exposure score (0 = safest, 100 = worst) based on
 * the number and severity of nearby hazards.
 */
export function calculateHazardExposureScore(
  nearbyHazards: NearbyHazard[]
): number {
  if (nearbyHazards.length === 0) return 0;

  let score = 0;
  for (const hazard of nearbyHazards) {
    // Closer hazards and higher severity = more dangerous
    const proximityFactor = 1 - hazard.distanceMeters / 500; // 1.0 at 0m, 0.0 at 500m
    const severityFactor = hazard.severity / 10; // 0.0 to 1.0
    score += proximityFactor * severityFactor * 30; // Each hazard contributes up to 30 points
  }

  return Math.min(100, Math.round(score));
}
