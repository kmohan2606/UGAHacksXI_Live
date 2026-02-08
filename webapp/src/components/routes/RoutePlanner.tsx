import { useState } from "react";
import { AlertTriangle, MapPin, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RouteInput } from "./RouteInput";
import { RouteCard } from "./RouteCard";
import { EnvironmentalBadges } from "./EnvironmentalBadges";
import { GeminiRecommendation } from "./GeminiRecommendation";
import { RouteMap } from "./RouteMap";
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
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <MapPin className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Route Planner</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            AI-powered eco-friendly route recommendations with real-time hazard avoidance
          </p>
        </header>

        <section className="bg-card/50 rounded-2xl p-4 shadow-sm border border-border/50 backdrop-blur-sm">
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
            {/* Environmental conditions */}
            <section>
              <EnvironmentalBadges data={data.environmental} />
            </section>

            {/* Map with route polylines + hazard markers */}
            <section>
              <RouteMap
                routes={data.routes}
                hazards={hazardsOnRoute}
                selectedRouteId={selectedRouteId}
                recommendedRouteId={data.recommendation.recommendedRouteId}
                onSelectRoute={setSelectedRouteId}
              />
            </section>

            {/* Hazard alert banner */}
            {hasHazards && (
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <Shield className="h-4 w-4 text-amber-400" />
                <AlertTitle className="text-amber-400">
                  {hazardsOnRoute.length} Hazard{hazardsOnRoute.length > 1 ? "s" : ""} Detected Near Your Route
                </AlertTitle>
                <AlertDescription className="text-amber-400/80">
                  {hazardsOnRoute.map((h) => {
                    const sourceLabel = h.source === "camera" ? "cam" : "report";
                    return `${h.type} (${sourceLabel}, severity ${h.severity}/10)`;
                  }).join(" · ")}
                  {data.routes.some((r) => r.isHazardAvoiding) ? (
                    <span className="block mt-1 font-medium text-emerald-400">
                      Hazard-avoiding routes have been generated automatically.
                    </span>
                  ) : null}
                </AlertDescription>
              </Alert>
            )}

            {/* Gemini AI recommendation */}
            <section>
              <GeminiRecommendation recommendation={data.recommendation} />
            </section>

            {/* Route cards */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Available Routes ({data.routes.length})
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
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p>Enter your origin and destination to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
