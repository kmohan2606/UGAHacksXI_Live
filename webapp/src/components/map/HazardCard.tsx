import { useState } from "react";
import {
  Flame,
  Droplets,
  AlertTriangle,
  Car,
  Construction,
  CloudRain,
  Trash2,
  CheckCircle,
  MapPin,
  Clock,
  Activity,
  RefreshCw,
  ImageOff,
} from "lucide-react";
import type { HazardType, Camera } from "../../../../backend/src/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface HazardCardProps {
  camera: Camera;
  onClose?: () => void;
  className?: string;
}

const hazardConfig: Record<
  HazardType,
  { icon: typeof Flame; color: string; bgColor: string; badgeVariant: string }
> = {
  Fire: {
    icon: Flame,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    badgeVariant: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  Flood: {
    icon: Droplets,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    badgeVariant: "bg-blue-400/20 text-blue-400 border-blue-400/30",
  },
  Crash: {
    icon: Car,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    badgeVariant: "bg-orange-500/20 text-orange-400 border-orange-400/30",
  },
  Stall: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    badgeVariant: "bg-amber-400/20 text-amber-400 border-amber-400/30",
  },
  Debris: {
    icon: Trash2,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    badgeVariant: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  },
  Construction: {
    icon: Construction,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    badgeVariant: "bg-amber-500/20 text-amber-400 border-amber-400/30",
  },
  Weather: {
    icon: CloudRain,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    badgeVariant: "bg-sky-400/20 text-sky-400 border-sky-400/30",
  },
  Clear: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    badgeVariant: "bg-emerald-400/20 text-emerald-400 border-emerald-400/30",
  },
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function getSeverityColor(severity: number): string {
  if (severity <= 3) return "bg-emerald-500";
  if (severity <= 6) return "bg-amber-500";
  return "bg-red-500";
}

function getSeverityLabel(severity: number): string {
  if (severity <= 3) return "Low";
  if (severity <= 6) return "Medium";
  return "High";
}

export function HazardCard({ camera, className }: HazardCardProps) {
  const { currentStatus } = camera;
  const config = hazardConfig[currentStatus.type];
  const Icon = config.icon;
  const isActive = currentStatus.hazard && currentStatus.type !== "Clear";

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefreshImage = () => {
    setImageLoaded(false);
    setImageError(false);
    setRefreshKey(prev => prev + 1);
  };

  // Proxy camera images through our backend to avoid CORS/mixed-content issues
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const rawImageUrl = camera.imageUrl.split('?')[0];
  const imageUrlWithTimestamp = `${API_BASE_URL}/api/cameras/proxy-image?url=${encodeURIComponent(rawImageUrl)}&r=${refreshKey}`;

  return (
    <Card
      className={cn(
        "border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300",
        "hover:border-border hover:bg-card",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                config.bgColor
              )}
            >
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">{camera.locationName}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate">
                  {camera.lat.toFixed(4)}, {camera.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
          <Badge className={cn("flex-shrink-0 border", config.badgeVariant)}>
            {currentStatus.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Live Camera Feed */}
        <div className="relative rounded-lg overflow-hidden bg-muted/30 border border-border/50">
          <div className="aspect-video relative">
            {!imageLoaded && !imageError && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            {imageError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <ImageOff className="w-8 h-8 mb-2" />
                <p className="text-xs">Camera feed unavailable</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshImage}
                  className="mt-2"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            ) : (
              <img
                key={refreshKey}
                src={imageUrlWithTimestamp}
                alt={`Live feed from ${camera.locationName}`}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}
            {/* Live indicator */}
            {imageLoaded && !imageError && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium text-white">LIVE</span>
              </div>
            )}
            {/* Refresh button */}
            {imageLoaded && !imageError && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshImage}
                className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isActive ? "bg-red-500 animate-pulse" : "bg-emerald-500"
            )}
          />
          <span className={cn("text-sm font-medium", isActive ? "text-red-400" : "text-emerald-400")}>
            {isActive ? "Active Hazard" : "Clear"}
          </span>
        </div>

        {/* Severity Indicator */}
        {isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span>Severity</span>
              </div>
              <span className="font-medium">
                {currentStatus.severity}/10 ({getSeverityLabel(currentStatus.severity)})
              </span>
            </div>
            <Progress
              value={currentStatus.severity * 10}
              className={cn("h-2 bg-muted/50", getSeverityColor(currentStatus.severity))}
            />
          </div>
        )}

        {/* Gemini Explanation */}
        {currentStatus.geminiExplanation && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              AI Analysis
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {currentStatus.geminiExplanation}
            </p>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <Clock className="w-3 h-3" />
          <span>Updated {formatRelativeTime(currentStatus.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function HazardCardCompact({ camera, onClick }: { camera: Camera; onClick?: () => void }) {
  const { currentStatus } = camera;
  const config = hazardConfig[currentStatus.type];
  const Icon = config.icon;
  const isActive = currentStatus.hazard && currentStatus.type !== "Clear";

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Proxy camera images through our backend to avoid CORS/mixed-content issues
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const rawImageUrl = camera.imageUrl.split('?')[0];
  const thumbnailUrl = `${API_BASE_URL}/api/cameras/proxy-image?url=${encodeURIComponent(rawImageUrl)}`;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm",
        "flex items-center gap-3 text-left transition-all duration-200",
        "hover:bg-card hover:border-border"
      )}
    >
      {/* Camera Thumbnail */}
      <div className="flex-shrink-0 w-16 h-12 rounded-md overflow-hidden bg-muted/30 relative">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <ImageOff className="w-4 h-4 text-muted-foreground" />
          </div>
        ) : (
          <img
            src={thumbnailUrl}
            alt=""
            className={cn(
              "w-full h-full object-cover transition-opacity",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
        {/* Live dot indicator */}
        {imageLoaded && !imageError && (
          <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>

      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
          config.bgColor
        )}
      >
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">{camera.locationName}</span>
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-xs", config.color)}>{currentStatus.type}</span>
          {isActive && (
            <span className="text-xs text-muted-foreground">
              Severity: {currentStatus.severity}/10
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
