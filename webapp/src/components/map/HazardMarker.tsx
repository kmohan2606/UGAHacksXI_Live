import { useState } from "react";
import {
  Flame,
  Droplets,
  AlertTriangle,
  Camera,
  Car,
  Construction,
  CloudRain,
  Trash2,
  CheckCircle,
} from "lucide-react";
import type { HazardType, Camera as CameraType } from "../../../../backend/src/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HazardMarkerProps {
  camera: CameraType;
  onClick?: (camera: CameraType) => void;
  isSelected?: boolean;
}

const hazardConfig: Record<
  HazardType,
  { icon: typeof Flame; color: string; bgColor: string; glowColor: string }
> = {
  Fire: {
    icon: Flame,
    color: "text-red-500",
    bgColor: "bg-red-500/20",
    glowColor: "shadow-red-500/50",
  },
  Flood: {
    icon: Droplets,
    color: "text-blue-400",
    bgColor: "bg-blue-400/20",
    glowColor: "shadow-blue-400/50",
  },
  Crash: {
    icon: Car,
    color: "text-orange-500",
    bgColor: "bg-orange-500/20",
    glowColor: "shadow-orange-500/50",
  },
  Stall: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bgColor: "bg-amber-400/20",
    glowColor: "shadow-amber-400/50",
  },
  Debris: {
    icon: Trash2,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/20",
    glowColor: "shadow-yellow-500/50",
  },
  Construction: {
    icon: Construction,
    color: "text-amber-500",
    bgColor: "bg-amber-500/20",
    glowColor: "shadow-amber-500/50",
  },
  Weather: {
    icon: CloudRain,
    color: "text-sky-400",
    bgColor: "bg-sky-400/20",
    glowColor: "shadow-sky-400/50",
  },
  Clear: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/20",
    glowColor: "shadow-emerald-400/50",
  },
};

export function HazardMarker({ camera, onClick, isSelected }: HazardMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { currentStatus } = camera;
  const config = hazardConfig[currentStatus.type];
  const Icon = config.icon;
  const isActive = currentStatus.hazard && currentStatus.type !== "Clear";

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={() => onClick?.(camera)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
              "border-2 backdrop-blur-sm cursor-pointer",
              config.bgColor,
              isActive ? "border-current" : "border-border/50",
              isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              isHovered && "scale-110 z-10",
              isActive && "shadow-lg",
              isActive && config.glowColor
            )}
            style={{
              animation: isActive ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : undefined,
            }}
          >
            {/* Pulsing ring for active hazards */}
            {isActive && (
              <span
                className={cn(
                  "absolute inset-0 rounded-full animate-ping opacity-30",
                  config.bgColor
                )}
              />
            )}
            <Icon className={cn("w-5 h-5 relative z-10", config.color)} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-card border-border/50 backdrop-blur-md"
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{camera.locationName}</span>
            <span className={cn("text-xs flex items-center gap-1", config.color)}>
              <Icon className="w-3 h-3" />
              {currentStatus.type}
              {isActive && ` - Severity: ${currentStatus.severity}/10`}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function HazardMarkerLegend() {
  return (
    <div className="flex flex-wrap gap-3 p-3 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50">
      {Object.entries(hazardConfig).map(([type, config]) => {
        const Icon = config.icon;
        return (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", config.bgColor)}>
              <Icon className={cn("w-3.5 h-3.5", config.color)} />
            </div>
            <span className="text-xs text-muted-foreground">{type}</span>
          </div>
        );
      })}
    </div>
  );
}
