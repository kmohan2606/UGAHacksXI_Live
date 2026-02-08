import { useState } from "react";
import {
  Clock,
  Route,
  Leaf,
  Shield,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Cloud,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { RouteOption } from "../../../../backend/src/types";

interface RouteCardProps {
  route: RouteOption;
  isRecommended?: boolean;
  safetyScore?: number;
  onSelect?: () => void;
  isSelected?: boolean;
}

export function RouteCard({
  route,
  isRecommended = false,
  safetyScore,
  onSelect,
  isSelected = false,
}: RouteCardProps) {
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const hazardCount = route.nearbyHazards?.length ?? 0;
  const hazardScore = route.hazardExposureScore ?? 0;

  // Determine card border color based on hazard exposure
  const getBorderColor = () => {
    if (route.isHazardAvoiding) return "border-emerald-500/30 bg-emerald-500/5";
    if (hazardScore > 50) return "border-red-500/30 bg-red-500/5";
    if (hazardScore > 20) return "border-amber-500/30 bg-amber-500/5";
    return "";
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md bg-card/50 border-border/50",
        isSelected && "ring-2 ring-emerald-500 shadow-lg",
        isRecommended && "border-emerald-500/30 bg-emerald-500/5",
        !isRecommended && !isSelected && getBorderColor()
      )}
      onClick={onSelect}
    >
      {isRecommended && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 gap-1">
            <Sparkles className="h-3 w-3" />
            Gemini Pick
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 pr-20">
          <h3 className="font-semibold text-lg text-foreground leading-tight">
            {route.name}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {/* Hazard avoidance badge */}
          {route.isHazardAvoiding ? (
            <Badge
              variant="secondary"
              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1"
            >
              <ShieldCheck className="h-3 w-3" />
              Hazard-Avoiding
            </Badge>
          ) : null}

          {/* Eco-friendly badge */}
          {route.isEcoFriendly ? (
            <Badge
              variant="secondary"
              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1"
            >
              <Leaf className="h-3 w-3" />
              Eco
            </Badge>
          ) : null}

          {/* CO2 saved badge */}
          {route.co2SavedKg !== undefined && route.co2SavedKg > 0 ? (
            <Badge
              variant="secondary"
              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1"
            >
              -{route.co2SavedKg.toFixed(1)} kg CO2
            </Badge>
          ) : null}

          {/* CO2 total badge */}
          {route.co2Kg !== undefined ? (
            <Badge
              variant="secondary"
              className="bg-secondary/50 text-muted-foreground border-border/50 gap-1"
            >
              <Cloud className="h-3 w-3" />
              {route.co2Kg.toFixed(1)} kg CO2
            </Badge>
          ) : null}

          {/* Safety score badge */}
          {safetyScore !== undefined ? (
            <Badge
              variant="secondary"
              className={cn(
                "gap-1",
                safetyScore >= 80
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : safetyScore >= 50
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              )}
            >
              <Shield className="h-3 w-3" />
              {safetyScore}% Safe
            </Badge>
          ) : null}

          {/* Hazard exposure badge */}
          {hazardCount > 0 ? (
            <Badge
              variant="secondary"
              className={cn(
                "gap-1",
                hazardScore > 50
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : hazardScore > 20
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {hazardCount} hazard{hazardCount > 1 ? "s" : ""} nearby
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1"
            >
              <ShieldCheck className="h-3 w-3" />
              Hazard-free
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {formatDuration(route.durationMinutes)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {formatDistance(route.distanceKm)}
            </span>
          </div>
        </div>

        <RoutePolyline
          isEcoFriendly={route.isEcoFriendly}
          isHazardAvoiding={route.isHazardAvoiding}
        />

        {route.steps.length > 0 && (
          <Collapsible open={isDirectionsOpen} onOpenChange={setIsDirectionsOpen}>
            <CollapsibleTrigger
              className="flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors w-full justify-between py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{isDirectionsOpen ? "Hide" : "Show"} directions</span>
              {isDirectionsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ol className="space-y-2 border-l-2 border-emerald-500/30 pl-4 ml-1">
                {route.steps.map((step, index) => (
                  <li key={index} className="relative">
                    <div className="absolute -left-[1.375rem] top-1 w-2 h-2 rounded-full bg-emerald-500" />
                    <div className="text-sm text-foreground/80">{step.instruction}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatDistance(step.distanceKm)} - {formatDuration(step.durationMinutes)}
                    </div>
                  </li>
                ))}
              </ol>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

function RoutePolyline({
  isEcoFriendly,
  isHazardAvoiding,
}: {
  isEcoFriendly: boolean;
  isHazardAvoiding?: boolean;
}) {
  const getColors = () => {
    if (isHazardAvoiding && isEcoFriendly) return { from: "#10b981", to: "#059669" };
    if (isHazardAvoiding) return { from: "#f59e0b", to: "#d97706" };
    if (isEcoFriendly) return { from: "#10b981", to: "#059669" };
    return { from: "#6366f1", to: "#4f46e5" };
  };

  const colors = getColors();
  const gradientId = `routeGrad-${isHazardAvoiding ? "avoid" : ""}${isEcoFriendly ? "eco" : "fast"}`;

  return (
    <div className="relative h-8 w-full overflow-hidden rounded-lg bg-secondary/50">
      <svg viewBox="0 0 200 30" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        <path
          d="M 5 15 Q 30 5, 50 15 T 100 15 T 150 15 T 195 15"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="5" cy="15" r="4" fill="#10b981" />
        <circle cx="195" cy="15" r="4" fill="#ef4444" />
      </svg>
    </div>
  );
}
