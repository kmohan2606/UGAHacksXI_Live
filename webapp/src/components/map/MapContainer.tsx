import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Camera } from "../../../../backend/src/types";
import { cn } from "@/lib/utils";

interface MapContainerProps {
  cameras: Camera[];
  selectedCamera: Camera | null;
  onSelectCamera: (camera: Camera) => void;
  className?: string;
}

// Hazard type → marker colors
const hazardColors: Record<string, { fill: string; stroke: string; pulse: boolean }> = {
  Fire: { fill: "#ef4444", stroke: "#dc2626", pulse: true },
  Flood: { fill: "#60a5fa", stroke: "#3b82f6", pulse: true },
  Crash: { fill: "#f97316", stroke: "#ea580c", pulse: true },
  Stall: { fill: "#fbbf24", stroke: "#f59e0b", pulse: true },
  Debris: { fill: "#eab308", stroke: "#ca8a04", pulse: true },
  Construction: { fill: "#f59e0b", stroke: "#d97706", pulse: true },
  Weather: { fill: "#38bdf8", stroke: "#0ea5e9", pulse: true },
  Clear: { fill: "#34d399", stroke: "#10b981", pulse: false },
};

// SVG icons for each hazard type
const hazardIcons: Record<string, string> = {
  Fire: `<path d="M12 2c-2.5 4-6 6-6 10a6 6 0 1012 0c0-4-3.5-6-6-10z" fill="white" stroke="white" stroke-width="0.5"/>`,
  Flood: `<path d="M12 2v6m0 0l-4 4m4-4l4 4M6 18h12" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
  Crash: `<path d="M7 17h10M5 13l2-8h10l2 8M9 17v2M15 17v2" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`,
  Stall: `<path d="M12 9v4m0 4h.01M12 3l9 18H3z" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  Debris: `<path d="M3 6h18M8 6V4h8v2M5 6v12a2 2 0 002 2h10a2 2 0 002-2V6" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`,
  Construction: `<path d="M2 20h20M6 20V10l6-6 6 6v10M10 20v-4h4v4" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  Weather: `<path d="M20 17H4M12 3v2m6.36 1.64l-1.41 1.41M21 12h-2M17.95 17.95l-1.41-1.41M12 21v-2M6.05 17.95l1.41-1.41M3 12h2M6.64 6.64l1.41 1.41" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`,
  Clear: `<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
};

function createMarkerIcon(camera: Camera, isSelected: boolean): L.DivIcon {
  const type = camera.currentStatus.type;
  const isActive = camera.currentStatus.hazard && type !== "Clear";
  const colors = hazardColors[type] || hazardColors.Clear;
  const iconSvg = hazardIcons[type] || hazardIcons.Clear;

  const size = isSelected ? 40 : 32;
  const pulseRing = isActive
    ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${colors.fill};opacity:0.4;animation:leaflet-marker-ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>`
    : "";
  const selectedRing = isSelected
    ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #22c55e;box-shadow:0 0 8px #22c55e80;"></div>`
    : "";

  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      ${pulseRing}
      ${selectedRing}
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${colors.fill};border:2px solid ${colors.stroke};
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px ${colors.fill}80;
        cursor:pointer;transition:transform 0.2s;
      ">
        <svg viewBox="0 0 24 24" width="${size * 0.5}" height="${size * 0.5}" style="filter:drop-shadow(0 1px 1px rgba(0,0,0,0.3));">
          ${iconSvg}
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "leaflet-camera-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function MapContainer({
  cameras,
  selectedCamera,
  onSelectCamera,
  className,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Compute bounds from camera data
  const bounds = useMemo(() => {
    if (cameras.length === 0) {
      // Default to Atlanta center
      return {
        center: [33.749, -84.388] as [number, number],
        zoom: 11,
      };
    }

    const lats = cameras.map((c) => c.lat);
    const lngs = cameras.map((c) => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number],
      bounds: L.latLngBounds([minLat - 0.02, minLng - 0.02], [maxLat + 0.02, maxLng + 0.02]),
    };
  }, [cameras]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
    });

    // Dark themed tile layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    // Add zoom control to top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    mapRef.current = map;

    // Set initial view
    if (bounds.bounds) {
      map.fitBounds(bounds.bounds, { padding: [40, 40] });
    } else {
      map.setView(bounds.center, bounds.zoom || 11);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fit bounds when cameras change
  useEffect(() => {
    if (!mapRef.current) return;
    if (bounds.bounds) {
      mapRef.current.fitBounds(bounds.bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [bounds]);

  // Handle camera selection callback
  const onSelectCameraRef = useRef(onSelectCamera);
  onSelectCameraRef.current = onSelectCamera;

  // Sync markers with camera data
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const newCameraIds = new Set(cameras.map((c) => c.camId));

    // Remove markers for cameras no longer in the list
    for (const [camId, marker] of currentMarkers) {
      if (!newCameraIds.has(camId)) {
        map.removeLayer(marker);
        currentMarkers.delete(camId);
      }
    }

    // Add or update markers
    for (const camera of cameras) {
      const isSelected = selectedCamera?.camId === camera.camId;
      const icon = createMarkerIcon(camera, isSelected);
      const existingMarker = currentMarkers.get(camera.camId);

      if (existingMarker) {
        existingMarker.setLatLng([camera.lat, camera.lng]);
        existingMarker.setIcon(icon);
      } else {
        const marker = L.marker([camera.lat, camera.lng], { icon })
          .addTo(map);

        // Bind tooltip
        marker.bindTooltip(
          `<div style="font-weight:600;font-size:12px;max-width:200px;">${camera.locationName}</div>
           <div style="font-size:11px;color:#888;margin-top:2px;">${camera.currentStatus.type}${
            camera.currentStatus.hazard && camera.currentStatus.type !== "Clear"
              ? ` — Severity: ${camera.currentStatus.severity}/10`
              : ""
          }</div>`,
          {
            direction: "top",
            offset: [0, -20],
            className: "leaflet-camera-tooltip",
          }
        );

        // Store camera reference for click handling
        (marker as any)._cameraData = camera;
        marker.on("click", () => {
          const cam = (marker as any)._cameraData;
          if (cam) onSelectCameraRef.current(cam);
        });

        currentMarkers.set(camera.camId, marker);
      }

      // Update stored camera data reference
      const marker = currentMarkers.get(camera.camId);
      if (marker) {
        (marker as any)._cameraData = camera;
      }
    }
  }, [cameras, selectedCamera]);

  // Pan to selected camera
  useEffect(() => {
    if (!mapRef.current || !selectedCamera) return;
    mapRef.current.setView([selectedCamera.lat, selectedCamera.lng], 14, {
      animate: true,
      duration: 0.5,
    });
  }, [selectedCamera]);

  return (
    <div
      className={cn(
        "relative w-full h-full rounded-xl overflow-hidden",
        "border border-border/50",
        className
      )}
    >
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />
      {/* Inject custom styles for markers */}
      <style>{`
        .leaflet-camera-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-camera-marker:hover > div > div:last-child {
          transform: scale(1.15);
        }
        .leaflet-camera-tooltip {
          background: hsl(160, 20%, 10%) !important;
          border: 1px solid hsl(155, 30%, 20%) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          color: #e2e8f0 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .leaflet-camera-tooltip::before {
          border-top-color: hsl(155, 30%, 20%) !important;
        }
        @keyframes leaflet-marker-ping {
          0% { transform: scale(1); opacity: 0.4; }
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
        .leaflet-control-zoom a {
          background-color: hsl(160, 20%, 10%) !important;
          color: #a3e635 !important;
          border-color: hsl(155, 30%, 20%) !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: hsl(160, 20%, 15%) !important;
        }
        .leaflet-control-attribution {
          background: hsl(160, 20%, 6%, 0.8) !important;
          color: hsl(155, 20%, 40%) !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: hsl(155, 60%, 45%) !important;
        }
      `}</style>
    </div>
  );
}
