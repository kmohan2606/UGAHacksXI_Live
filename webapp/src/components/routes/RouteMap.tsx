import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteOption, HazardPoint } from "../../../../backend/src/types";
import { cn } from "@/lib/utils";

interface RouteMapProps {
  routes: RouteOption[];
  hazards: HazardPoint[];
  selectedRouteId: string | null;
  recommendedRouteId?: string;
  onSelectRoute?: (routeId: string) => void;
  className?: string;
}

// ==========================================
// Polyline decoder (same as backend/src/geo.ts)
// ==========================================

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

// ==========================================
// Route color scheme
// ==========================================

function getRouteColor(route: RouteOption, isSelected: boolean): string {
  if (route.isHazardAvoiding && route.isEcoFriendly) return "#10b981"; // emerald for safe+eco
  if (route.isHazardAvoiding) return "#f59e0b"; // amber for safe
  if (route.isEcoFriendly) return "#22c55e"; // green for eco
  return "#6366f1"; // indigo for fastest
}

function getRouteWeight(isSelected: boolean, isRecommended: boolean): number {
  if (isSelected) return 7;
  if (isRecommended) return 5;
  return 4;
}

function getRouteOpacity(isSelected: boolean, hasSelection: boolean): number {
  if (isSelected) return 0.95;
  if (hasSelection) return 0.35;
  return 0.7;
}

// ==========================================
// Hazard marker colors by source / type
// ==========================================

const hazardMarkerColors: Record<string, string> = {
  Flood: "#3b82f6",
  Fire: "#ef4444",
  Crash: "#f97316",
  Stall: "#fbbf24",
  Debris: "#eab308",
  Construction: "#f59e0b",
  Weather: "#38bdf8",
  flooding: "#3b82f6",
  obstruction: "#f97316",
  pothole: "#eab308",
  blocked_bike_lane: "#f59e0b",
  broken_charger: "#a855f7",
  other: "#6b7280",
};

function getHazardColor(hazard: HazardPoint): string {
  return hazardMarkerColors[hazard.type] ?? "#ef4444";
}

function createHazardIcon(hazard: HazardPoint): L.DivIcon {
  const color = getHazardColor(hazard);
  const isReport = hazard.source === "report";
  const size = 28;

  // Camera hazards get a camera-style icon, reports get a pin
  const iconPath = isReport
    ? `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white"/>`
    : `<path d="M12 9v4m0 4h.01M12 3l9 18H3z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};border:2px solid ${color};
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px ${color}80;
        opacity:0.9;
      ">
        <svg viewBox="0 0 24 24" width="${size * 0.5}" height="${size * 0.5}">
          ${iconPath}
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "leaflet-hazard-route-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ==========================================
// RouteMap Component
// ==========================================

export function RouteMap({
  routes,
  hazards,
  selectedRouteId,
  recommendedRouteId,
  onSelectRoute,
  className,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const markersRef = useRef<L.Marker[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);
  const onSelectRouteRef = useRef(onSelectRoute);
  onSelectRouteRef.current = onSelectRoute;

  // Compute bounds from all route polylines
  const allBounds = useMemo(() => {
    const allPoints: [number, number][] = [];
    for (const route of routes) {
      allPoints.push(...decodePolyline(route.polyline));
    }
    for (const hazard of hazards) {
      allPoints.push([hazard.lat, hazard.lng]);
    }
    if (allPoints.length === 0) {
      return null;
    }
    return L.latLngBounds(allPoints);
  }, [routes, hazards]);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    // Default Atlanta view
    map.setView([33.749, -84.388], 11);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw/update route polylines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentPolylines = polylinesRef.current;
    const hasSelection = selectedRouteId !== null;

    // Remove old polylines
    for (const [id, polyline] of currentPolylines) {
      map.removeLayer(polyline);
    }
    currentPolylines.clear();

    // Draw routes (non-selected first, selected last so it's on top)
    const sortedRoutes = [...routes].sort((a, b) => {
      if (a.id === selectedRouteId) return 1;
      if (b.id === selectedRouteId) return -1;
      if (a.id === recommendedRouteId) return 1;
      if (b.id === recommendedRouteId) return -1;
      return 0;
    });

    for (const route of sortedRoutes) {
      const points = decodePolyline(route.polyline);
      if (points.length === 0) continue;

      const isSelected = route.id === selectedRouteId;
      const isRecommended = route.id === recommendedRouteId;
      const color = getRouteColor(route, isSelected);
      const weight = getRouteWeight(isSelected, isRecommended);
      const opacity = getRouteOpacity(isSelected, hasSelection);

      const polyline = L.polyline(points, {
        color,
        weight,
        opacity,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);

      // Add click handler
      polyline.on("click", () => {
        onSelectRouteRef.current?.(route.id);
      });

      // Tooltip with route name
      polyline.bindTooltip(
        `<div style="font-weight:600;font-size:12px;">${route.name}</div>
         <div style="font-size:11px;color:#aaa;margin-top:2px;">
           ${route.distanceKm} km · ${route.durationMinutes} min · ${route.co2Kg ?? 0} kg CO₂
         </div>`,
        {
          sticky: true,
          className: "leaflet-route-tooltip",
        }
      );

      currentPolylines.set(route.id, polyline);
    }

    // Fit bounds
    if (allBounds) {
      map.fitBounds(allBounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [routes, selectedRouteId, recommendedRouteId, allBounds]);

  // Draw hazard markers + danger zone circles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers and circles
    for (const marker of markersRef.current) {
      map.removeLayer(marker);
    }
    markersRef.current = [];

    for (const circle of circlesRef.current) {
      map.removeLayer(circle);
    }
    circlesRef.current = [];

    // Draw hazard markers
    for (const hazard of hazards) {
      const icon = createHazardIcon(hazard);
      const marker = L.marker([hazard.lat, hazard.lng], { icon }).addTo(map);

      const sourceLabel = hazard.source === "camera" ? "Camera Detection" : "Community Report";
      marker.bindPopup(
        `<div style="font-size:13px;">
          <div style="font-weight:700;margin-bottom:4px;color:${getHazardColor(hazard)};">
            ${hazard.type} (Severity: ${hazard.severity}/10)
          </div>
          <div style="color:#ccc;font-size:12px;margin-bottom:4px;">${hazard.description}</div>
          <div style="font-size:11px;color:#888;">Source: ${sourceLabel}</div>
        </div>`,
        {
          className: "leaflet-hazard-popup",
          maxWidth: 250,
        }
      );

      markersRef.current.push(marker);

      // Draw danger zone circle (500m radius)
      const circle = L.circle([hazard.lat, hazard.lng], {
        radius: 500,
        color: getHazardColor(hazard),
        fillColor: getHazardColor(hazard),
        fillOpacity: 0.08,
        weight: 1,
        opacity: 0.3,
        dashArray: "4 4",
      }).addTo(map);

      circlesRef.current.push(circle);
    }
  }, [hazards]);

  return (
    <div
      className={cn(
        "relative w-full rounded-xl overflow-hidden border border-border/50 shadow-sm",
        className
      )}
      style={{ height: "400px" }}
    >
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Route legend */}
      {routes.length > 0 && (
        <div className="absolute top-3 left-3 z-[1000] bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
          <div className="text-xs font-semibold text-gray-300 mb-2">Routes</div>
          <div className="space-y-1.5">
            {routes.map((route) => (
              <button
                key={route.id}
                onClick={() => onSelectRoute?.(route.id)}
                className={cn(
                  "flex items-center gap-2 text-xs w-full text-left px-1.5 py-1 rounded transition-colors",
                  route.id === selectedRouteId
                    ? "bg-gray-700/50 text-white"
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                <span
                  className="w-3 h-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getRouteColor(route, route.id === selectedRouteId) }}
                />
                <span className="truncate max-w-[160px]">{route.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .leaflet-hazard-route-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-route-tooltip {
          background: rgba(17, 24, 39, 0.95) !important;
          border: 1px solid rgba(75, 85, 99, 0.5) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          color: #e2e8f0 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .leaflet-route-tooltip::before {
          border-top-color: rgba(75, 85, 99, 0.5) !important;
        }
        .leaflet-hazard-popup .leaflet-popup-content-wrapper {
          background: rgba(17, 24, 39, 0.95) !important;
          color: #e2e8f0 !important;
          border-radius: 10px !important;
          border: 1px solid rgba(75, 85, 99, 0.5) !important;
        }
        .leaflet-hazard-popup .leaflet-popup-tip {
          background: rgba(17, 24, 39, 0.95) !important;
        }
        .leaflet-hazard-popup .leaflet-popup-close-button {
          color: #9ca3af !important;
        }
        .leaflet-control-zoom a {
          background-color: rgba(17, 24, 39, 0.9) !important;
          color: #a3e635 !important;
          border-color: rgba(75, 85, 99, 0.5) !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: rgba(17, 24, 39, 1) !important;
        }
        .leaflet-control-attribution {
          background: rgba(17, 24, 39, 0.8) !important;
          color: rgba(156, 163, 175, 0.8) !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: rgba(34, 197, 94, 0.8) !important;
        }
      `}</style>
    </div>
  );
}
