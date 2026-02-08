import {
  Wind,
  Thermometer,
  CloudSun,
  Droplets,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnvironmentalData } from "../../../../backend/src/types";

interface EnvironmentalBadgesProps {
  data: EnvironmentalData;
  className?: string;
}

export function EnvironmentalBadges({ data, className }: EnvironmentalBadgesProps) {
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return "bg-green-100 text-green-700 border-green-200";
    if (aqi <= 100) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (aqi <= 150) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getAqiLabel = (aqi: number) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Poor";
    return "Unhealthy";
  };

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes("rain") || conditionLower.includes("shower")) {
      return <CloudRain className="h-4 w-4" />;
    }
    if (conditionLower.includes("snow")) {
      return <CloudSnow className="h-4 w-4" />;
    }
    if (conditionLower.includes("thunder") || conditionLower.includes("storm")) {
      return <CloudLightning className="h-4 w-4" />;
    }
    if (conditionLower.includes("cloud") || conditionLower.includes("overcast")) {
      return <Cloud className="h-4 w-4" />;
    }
    if (conditionLower.includes("clear") || conditionLower.includes("sunny")) {
      return <Sun className="h-4 w-4" />;
    }
    return <CloudSun className="h-4 w-4" />;
  };

  const shouldShowUv = data.uvIndex !== undefined && data.uvIndex >= 6;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm",
        className
      )}
    >
      <BadgeItem
        icon={<Wind className="h-4 w-4" />}
        label="AQI"
        value={`${data.airQualityIndex}`}
        sublabel={getAqiLabel(data.airQualityIndex)}
        className={getAqiColor(data.airQualityIndex)}
      />

      <BadgeItem
        icon={<Thermometer className="h-4 w-4" />}
        label="Temp"
        value={`${Math.round(data.temperature)}°F`}
        className="bg-blue-50 text-blue-700 border-blue-200"
      />

      <BadgeItem
        icon={getWeatherIcon(data.weatherCondition)}
        label="Weather"
        value={data.weatherCondition}
        className="bg-gray-50 text-gray-700 border-gray-200"
      />

      <BadgeItem
        icon={<Droplets className="h-4 w-4" />}
        label="Humidity"
        value={`${data.humidity}%`}
        className="bg-cyan-50 text-cyan-700 border-cyan-200"
      />

      {shouldShowUv && (
        <BadgeItem
          icon={<Sun className="h-4 w-4" />}
          label="UV"
          value={`${data.uvIndex}`}
          sublabel="High"
          className="bg-amber-100 text-amber-700 border-amber-200"
        />
      )}
    </div>
  );
}

interface BadgeItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  className?: string;
}

function BadgeItem({ icon, label, value, sublabel, className }: BadgeItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium",
        className
      )}
    >
      {icon}
      <div className="flex flex-col">
        <span className="text-xs opacity-70">{label}</span>
        <span className="leading-tight">
          {value}
          {sublabel && <span className="ml-1 text-xs opacity-70">({sublabel})</span>}
        </span>
      </div>
    </div>
  );
}
