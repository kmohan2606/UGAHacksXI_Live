import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Camera } from "../../../backend/src/types";

export function useCameras() {
  return useQuery({
    queryKey: ["cameras"],
    queryFn: () => api.get<Camera[]>("/api/cameras"),
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

export function useCameraStats(cameras: Camera[] | undefined) {
  if (!cameras) {
    return {
      totalCameras: 0,
      activeHazards: 0,
      clearRoutes: 0,
    };
  }

  const activeHazards = cameras.filter(
    (cam) => cam.currentStatus.hazard && cam.currentStatus.type !== "Clear"
  ).length;

  return {
    totalCameras: cameras.length,
    activeHazards,
    clearRoutes: cameras.length - activeHazards,
  };
}
