import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CommunityReport,
  CreateReportRequest,
} from "../../../backend/src/types";

export function useReports(status?: "pending" | "verified" | "resolved") {
  return useQuery({
    queryKey: ["reports", status],
    queryFn: () => {
      const endpoint = status
        ? `/api/reports?status=${status}`
        : "/api/reports";
      return api.get<CommunityReport[]>(endpoint);
    },
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReportRequest) =>
      api.post<CommunityReport>("/api/reports", data),
    onSuccess: () => {
      // Invalidate all reports queries to refetch
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
