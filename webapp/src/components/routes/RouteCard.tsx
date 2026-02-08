import { useState } from "react";
import {
  Clock,
  Route,
  Leaf,
  Shield,
  ChevronDown,
  ChevronUp,
  Sparkles,
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

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md",
        isSelected && "ring-2 ring-emerald-500 shadow-lg",
        isRecommended && "border-emerald-200 bg-emerald-50/30"
      )}
      onClick={onSelect}
    >
      {isRecommended && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 gap-1">
            <Sparkles className="h-3 w-3" />
            Gemini Pick
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 pr-20">
          <h3 className="font-semibold text-lg text-gray-900 leading-tight">
            {route.name}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {route.isEcoFriendly && (
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1"
            >
              <Leaf className="h-3 w-3" />
              Eco
            </Badge>
          )}
          {route.co2SavedKg !== undefined && route.co2SavedKg > 0 && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 border-green-200 gap-1"
            >
              -{route.co2SavedKg.toFixed(1)} kg CO2
            </Badge>
          )}
          {safetyScore !== undefined && (
            <Badge
              variant="secondary"
              className={cn(
                "gap-1",
                safetyScore >= 80
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : safetyScore >= 50
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-red-100 text-red-700 border-red-200"
              )}
            >
              <Shield className="h-3 w-3" />
              {safetyScore}% Safe
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">
              {formatDuration(route.durationMinutes)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">
              {formatDistance(route.distanceKm)}
            </span>
          </div>
        </div>

        <RoutePolyline isEcoFriendly={route.isEcoFriendly} />

        {route.steps.length > 0 && (
          <Collapsible open={isDirectionsOpen} onOpenChange={setIsDirectionsOpen}>
            <CollapsibleTrigger
              className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors w-full justify-between py-2"
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
              <ol className="space-y-2 border-l-2 border-emerald-200 pl-4 ml-1">
                {route.steps.map((step, index) => (
                  <li key={index} className="relative">
                    <div className="absolute -left-[1.375rem] top-1 w-2 h-2 rounded-full bg-emerald-500" />
                    <div className="text-sm text-gray-700">{step.instruction}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
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

function RoutePolyline({ isEcoFriendly }: { isEcoFriendly: boolean }) {
  return (
    <div className="relative h-8 w-full overflow-hidden rounded-lg bg-gray-100">
      <svg viewBox="0 0 200 30" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              stopColor={isEcoFriendly ? "#10b981" : "#6366f1"}
            />
            <stop
              offset="100%"
              stopColor={isEcoFriendly ? "#059669" : "#4f46e5"}
            />
          </linearGradient>
        </defs>
        <path
          d="M 5 15 Q 30 5, 50 15 T 100 15 T 150 15 T 195 15"
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="5" cy="15" r="4" fill="#10b981" />
        <circle cx="195" cy="15" r="4" fill="#ef4444" />
      </svg>
    </div>
  );
}
