import { cn } from "@/lib/utils";
import type { ReportType } from "../../../../backend/src/types";
import {
  Zap,
  Bike,
  Circle,
  Droplets,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";

interface ReportTypeOption {
  type: ReportType;
  label: string;
  icon: React.ReactNode;
}

const reportTypes: ReportTypeOption[] = [
  {
    type: "broken_charger",
    label: "Broken EV Charger",
    icon: <Zap className="h-6 w-6" />,
  },
  {
    type: "blocked_bike_lane",
    label: "Blocked Bike Lane",
    icon: <Bike className="h-6 w-6" />,
  },
  {
    type: "pothole",
    label: "Pothole",
    icon: <Circle className="h-6 w-6" />,
  },
  {
    type: "flooding",
    label: "Flooding",
    icon: <Droplets className="h-6 w-6" />,
  },
  {
    type: "obstruction",
    label: "Obstruction",
    icon: <AlertTriangle className="h-6 w-6" />,
  },
  {
    type: "other",
    label: "Other",
    icon: <MoreHorizontal className="h-6 w-6" />,
  },
];

interface ReportTypeSelectorProps {
  selectedType: ReportType | null;
  onSelect: (type: ReportType) => void;
}

export function ReportTypeSelector({
  selectedType,
  onSelect,
}: ReportTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        What would you like to report?
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {reportTypes.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => onSelect(option.type)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all min-h-[100px]",
              "hover:border-orange-500/50 hover:bg-orange-500/5",
              "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-background",
              selectedType === option.type
                ? "border-orange-500 bg-orange-500/10 text-orange-400"
                : "border-border/50 bg-card/50 text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "rounded-full p-2",
                selectedType === option.type
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-secondary/50 text-muted-foreground"
              )}
            >
              {option.icon}
            </div>
            <span className="text-xs font-medium text-center leading-tight">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { reportTypes };
