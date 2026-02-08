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
      <label className="text-sm font-medium text-gray-700">
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
              "hover:border-green-500 hover:bg-green-50/50",
              "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
              selectedType === option.type
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-600"
            )}
          >
            <div
              className={cn(
                "rounded-full p-2",
                selectedType === option.type
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-500"
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
