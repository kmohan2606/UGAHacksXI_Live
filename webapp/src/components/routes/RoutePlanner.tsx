import { useState } from "react";
import { AlertTriangle, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RouteInput } from "./RouteInput";
import { RouteCard } from "./RouteCard";
import { EnvironmentalBadges } from "./EnvironmentalBadges";
import { GeminiRecommendation } from "./GeminiRecommendation";
import { useRoutePlanner } from "@/hooks/useRoutePlanner";
import type { RouteRequest, RouteResponse } from "../../../../backend/src/types";

export function RoutePlanner() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const routePlannerMutation = useRoutePlanner();

  const handleSubmit = (request: RouteRequest) => {
    setSelectedRouteId(null);
    routePlannerMutation.mutate(request, {
      onSuccess: (data) => {
        if (data.recommendation?.recommendedRouteId) {
          setSelectedRouteId(data.recommendation.recommendedRouteId);
        }
      },
    });
  };

  const data: RouteResponse | undefined = routePlannerMutation.data;
  const isLoading = routePlannerMutation.isPending;
  const error = routePlannerMutation.error;

  const hazardsOnRoute = data?.hazardsOnRoute ?? [];
  const hasHazards = hazardsOnRoute.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-emerald-50/30 py-6 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Route Planner</h1>
          </div>
          <p className="text-gray-600 text-sm">
            AI-powered eco-friendly route recommendations
          </p>
        </header>

        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <RouteInput onSubmit={handleSubmit} isLoading={isLoading} />
        </section>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to plan route"}
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <>
            <section>
              <EnvironmentalBadges data={data.environmental} />
            </section>

            {hasHazards && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Hazards Detected</AlertTitle>
                <AlertDescription className="text-amber-700">
                  {hazardsOnRoute.length} hazard
                  {hazardsOnRoute.length > 1 ? "s" : ""} found on your route:{" "}
                  {hazardsOnRoute
                    .map(
                      (h) =>
                        `${h.currentStatus.type} at ${h.locationName}`
                    )
                    .join(", ")}
                </AlertDescription>
              </Alert>
            )}

            <section>
              <GeminiRecommendation recommendation={data.recommendation} />
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Available Routes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isRecommended={
                      route.id === data.recommendation.recommendedRouteId
                    }
                    safetyScore={
                      route.id === data.recommendation.recommendedRouteId
                        ? data.recommendation.safetyScore
                        : undefined
                    }
                    isSelected={route.id === selectedRouteId}
                    onSelect={() => setSelectedRouteId(route.id)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {!data && !isLoading && !error && (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Enter your origin and destination to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
