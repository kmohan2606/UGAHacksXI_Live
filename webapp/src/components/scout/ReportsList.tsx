import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useReports } from "@/hooks/useReports";
import { reportTypes } from "./ReportTypeSelector";
import type { CommunityReport } from "../../../../backend/src/types";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from "lucide-react";

type StatusFilter = "all" | "pending" | "verified" | "resolved";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "resolved", label: "Resolved" },
];

function getReportTypeInfo(type: CommunityReport["type"]) {
  return reportTypes.find((rt) => rt.type === type) || reportTypes[5]; // Default to "Other"
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface ReportCardProps {
  report: CommunityReport;
}

function ReportCard({ report }: ReportCardProps) {
  const typeInfo = getReportTypeInfo(report.type);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow bg-card/50 border-border/50">
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "shrink-0 rounded-lg p-2.5",
            report.status === "resolved"
              ? "bg-secondary/50 text-muted-foreground"
              : "bg-orange-500/20 text-orange-400"
          )}
        >
          {typeInfo.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-foreground text-sm">
                {typeInfo.label}
              </h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                <span>{formatTimestamp(report.timestamp)}</span>
              </div>
            </div>
            {/* Status Badge */}
            <Badge
              className={cn(
                "shrink-0 text-xs",
                report.status === "verified" &&
                  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                report.status === "pending" &&
                  "bg-amber-500/20 text-amber-400 border-amber-500/30",
                report.status === "resolved" &&
                  "bg-secondary/50 text-muted-foreground border-border/50"
              )}
              variant="outline"
            >
              {report.status === "verified" && (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              {report.status === "pending" && (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </Badge>
          </div>

          {/* Description */}
          {report.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {report.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-2">
            {/* Location */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>
                {report.lat.toFixed(3)}, {report.lng.toFixed(3)}
              </span>
            </div>

            {/* AI Verification Badge */}
            {report.verifiedByAi && (
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <Sparkles className="h-3 w-3" />
                <span>AI Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ReportCardSkeleton() {
  return (
    <Card className="p-4 bg-card/50 border-border/50">
      <div className="flex gap-3">
        <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ReportsList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: reports, isLoading, isError } = useReports(
    statusFilter === "all" ? undefined : statusFilter
  );

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              statusFilter === filter.value
                ? "bg-orange-500 text-white"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <ReportCardSkeleton />
            <ReportCardSkeleton />
            <ReportCardSkeleton />
          </>
        ) : isError ? (
          <Card className="p-6 text-center bg-card/50 border-border/50">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Failed to load reports. Please try again.
            </p>
          </Card>
        ) : reports && reports.length > 0 ? (
          reports.map((report) => (
            <ReportCard key={report.reportId} report={report} />
          ))
        ) : (
          <Card className="p-6 text-center bg-card/50 border-border/50">
            <div className="rounded-full bg-secondary/50 p-3 w-fit mx-auto mb-3">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No reports yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Be the first to report an issue in your area
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
