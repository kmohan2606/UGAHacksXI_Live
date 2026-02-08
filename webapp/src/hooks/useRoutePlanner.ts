import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RouteRequest, RouteResponse } from "../../../backend/src/types";

export function useRoutePlanner() {
  return useMutation({
    mutationFn: async (request: RouteRequest): Promise<RouteResponse> => {
      return api.post<RouteResponse>("/api/routes/plan", request);
    },
  });
}
