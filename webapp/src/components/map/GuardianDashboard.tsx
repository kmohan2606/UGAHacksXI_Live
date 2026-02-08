import { useState, useMemo } from "react";
import {
  Shield,
  Camera,
  AlertTriangle,
  CheckCircle,
  Filter,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  X,
  Binoculars,
  Sparkles,
  MapPin,
  Clock,
  Zap,
  Bike,
  Circle,
  Droplets,
  MoreHorizontal,
} from "lucide-react";
import type {
  Camera as CameraType,
  HazardType,
  CommunityReport,
  ReportType,
} from "../../../../backend/src/types";
import { cn } from "@/lib/utils";
import { useCameras, useCameraStats } from "@/hooks/useCameras";
import { useReports } from "@/hooks/useReports";
import { MapContainer } from "./MapContainer";
import { HazardCard, HazardCardCompact } from "./HazardCard";
import { HazardMarkerLegend } from "./HazardMarker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

// Report type config for display in the dashboard
const reportTypeConfig: Record<
  ReportType,
  { label: string; icon: typeof Zap; color: string; bgColor: string }
> = {
  broken_charger: { label: "Broken EV Charger", icon: Zap, color: "text-amber-400", bgColor: "bg-amber-400/10" },
  blocked_bike_lane: { label: "Blocked Bike Lane", icon: Bike, color: "text-indigo-400", bgColor: "bg-indigo-400/10" },
  pothole: { label: "Pothole", icon: Circle, color: "text-stone-400", bgColor: "bg-stone-400/10" },
  flooding: { label: "Flooding", icon: Droplets, color: "text-sky-400", bgColor: "bg-sky-400/10" },
  obstruction: { label: "Obstruction", icon: AlertTriangle, color: "text-orange-400", bgColor: "bg-orange-400/10" },
  other: { label: "Other Issue", icon: MoreHorizontal, color: "text-zinc-400", bgColor: "bg-zinc-400/10" },
};

const ALL_HAZARD_TYPES: HazardType[] = [
  "Fire",
  "Flood",
  "Crash",
  "Stall",
  "Debris",
  "Construction",
  "Weather",
  "Clear",
];

export function GuardianDashboard() {
  const { data: cameras, isLoading, error, refetch, isFetching } = useCameras();
  const { data: verifiedReports, isLoading: reportsLoading } = useReports("verified");
  const stats = useCameraStats(cameras);
  const isMobile = useIsMobile();

  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);
  const [filterTypes, setFilterTypes] = useState<HazardType[]>([]);
  const [showHazardsOnly, setShowHazardsOnly] = useState(false);
  const [showReports, setShowReports] = useState(true);
  const [mobileListExpanded, setMobileListExpanded] = useState(false);

  const filteredCameras = useMemo(() => {
    if (!cameras) return [];

    let filtered = cameras;

    if (showHazardsOnly) {
      filtered = filtered.filter(
        (cam) => cam.currentStatus.hazard && cam.currentStatus.type !== "Clear"
      );
    }

    if (filterTypes.length > 0) {
      filtered = filtered.filter((cam) => filterTypes.includes(cam.currentStatus.type));
    }

    // Sort by severity (highest first), then by active hazards
    return [...filtered].sort((a, b) => {
      const aActive = a.currentStatus.hazard && a.currentStatus.type !== "Clear";
      const bActive = b.currentStatus.hazard && b.currentStatus.type !== "Clear";

      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      return b.currentStatus.severity - a.currentStatus.severity;
    });
  }, [cameras, filterTypes, showHazardsOnly]);

  const toggleFilter = (type: HazardType) => {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCameraSelect = (camera: CameraType) => {
    setSelectedReport(null);
    setSelectedCamera(camera);
  };

  const handleReportSelect = (report: CommunityReport) => {
    setSelectedCamera(null);
    setSelectedReport(report);
  };

  const handleCloseDetail = () => {
    setSelectedCamera(null);
    setSelectedReport(null);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-4">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Connection Error</h2>
        <p className="text-muted-foreground text-center mb-4">
          Unable to connect to the Guardian network. Please check your connection.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border/50 bg-card/50 backdrop-blur-md z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Guardian</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Atlanta Traffic Intelligence
              </p>
            </div>
          </div>

          {/* Stats - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <StatBadge
              icon={Camera}
              label="Cameras"
              value={stats.totalCameras}
              loading={isLoading}
            />
            <StatBadge
              icon={AlertTriangle}
              label="Active Hazards"
              value={stats.activeHazards}
              loading={isLoading}
              variant="warning"
            />
            <StatBadge
              icon={Binoculars}
              label="Scout Reports"
              value={verifiedReports?.length ?? 0}
              loading={reportsLoading}
              variant="success"
            />
            <StatBadge
              icon={CheckCircle}
              label="Clear"
              value={stats.clearRoutes}
              loading={isLoading}
              variant="success"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Stats - Mobile */}
        <div className="flex md:hidden items-center gap-2 px-4 pb-3 overflow-x-auto">
          <StatBadge icon={Camera} label="Cameras" value={stats.totalCameras} loading={isLoading} />
          <StatBadge
            icon={AlertTriangle}
            label="Hazards"
            value={stats.activeHazards}
            loading={isLoading}
            variant="warning"
          />
          <StatBadge
            icon={Binoculars}
            label="Reports"
            value={verifiedReports?.length ?? 0}
            loading={reportsLoading}
            variant="success"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative p-2 sm:p-4">
          {isLoading ? (
            <Skeleton className="w-full h-full rounded-xl" />
          ) : (
            <MapContainer
              cameras={filteredCameras}
              reports={showReports ? verifiedReports ?? [] : []}
              selectedCamera={selectedCamera}
              selectedReport={selectedReport}
              onSelectCamera={handleCameraSelect}
              onSelectReport={handleReportSelect}
            />
          )}

          {/* Filter Controls - Floating */}
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-card/90 backdrop-blur-sm border border-border/50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {filterTypes.length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                      {filterTypes.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {ALL_HAZARD_TYPES.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={filterTypes.includes(type)}
                    onCheckedChange={() => toggleFilter(type)}
                  >
                    {type}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={showHazardsOnly ? "default" : "secondary"}
              size="sm"
              onClick={() => setShowHazardsOnly(!showHazardsOnly)}
              className={cn(
                "bg-card/90 backdrop-blur-sm border border-border/50",
                showHazardsOnly && "bg-destructive/90 border-destructive/50 text-destructive-foreground"
              )}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Hazards Only
            </Button>

            <Button
              variant={showReports ? "default" : "secondary"}
              size="sm"
              onClick={() => setShowReports(!showReports)}
              className={cn(
                "bg-card/90 backdrop-blur-sm border border-border/50",
                showReports && "bg-blue-600/90 border-blue-500/50 text-white"
              )}
            >
              <Binoculars className="w-4 h-4 mr-2" />
              Scout Reports
              {verifiedReports && verifiedReports.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                  {verifiedReports.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Legend - Desktop */}
          <div className="absolute bottom-6 left-6 hidden lg:block z-10">
            <HazardMarkerLegend />
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-96 border-l border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-semibold text-foreground">Camera Feed</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredCameras.length} cameras{" "}
              {filterTypes.length > 0 || showHazardsOnly ? "(filtered)" : ""}
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {/* Verified Scout Reports Section */}
              {showReports && verifiedReports && verifiedReports.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-1 pt-1 pb-2">
                    <Binoculars className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                      Scout Reports ({verifiedReports.length})
                    </span>
                  </div>
                  {verifiedReports.map((report) => (
                    <ReportCardCompact
                      key={report.reportId}
                      report={report}
                      onClick={() => handleReportSelect(report)}
                    />
                  ))}
                  <div className="border-t border-border/50 my-2" />
                </>
              )}

              {/* Camera Feed */}
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))
              ) : filteredCameras.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No cameras match your filters</p>
                </div>
              ) : (
                filteredCameras.map((camera) => (
                  <HazardCardCompact
                    key={camera.camId}
                    camera={camera}
                    onClick={() => handleCameraSelect(camera)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Mobile Bottom Sheet */}
        {isMobile && (
          <div className="lg:hidden border-t border-border/50 bg-card/80 backdrop-blur-md">
            <button
              onClick={() => setMobileListExpanded(!mobileListExpanded)}
              className="w-full flex items-center justify-between p-3"
            >
              <span className="font-medium text-foreground">
                {filteredCameras.length} Cameras
                {showReports && verifiedReports && verifiedReports.length > 0
                  ? ` · ${verifiedReports.length} Reports`
                  : ""}
              </span>
              {mobileListExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                mobileListExpanded ? "max-h-[40vh]" : "max-h-0"
              )}
            >
              <ScrollArea className="h-[40vh]">
                <div className="p-3 space-y-2">
                  {/* Verified Scout Reports */}
                  {showReports && verifiedReports && verifiedReports.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-1 pb-1">
                        <Binoculars className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                          Scout Reports
                        </span>
                      </div>
                      {verifiedReports.map((report) => (
                        <ReportCardCompact
                          key={report.reportId}
                          report={report}
                          onClick={() => {
                            handleReportSelect(report);
                            setMobileListExpanded(false);
                          }}
                        />
                      ))}
                      <div className="border-t border-border/50 my-2" />
                    </>
                  )}
                  {filteredCameras.map((camera) => (
                    <HazardCardCompact
                      key={camera.camId}
                      camera={camera}
                      onClick={() => {
                        handleCameraSelect(camera);
                        setMobileListExpanded(false);
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      {/* Camera Detail Sheet */}
      <Sheet open={!!selectedCamera} onOpenChange={(open) => !open && handleCloseDetail()}>
        <SheetContent side={isMobile ? "bottom" : "right"} className="p-0 sm:max-w-md">
          <SheetHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-foreground">Camera Details</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseDetail}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>
          <div className="p-4">
            {selectedCamera && <HazardCard camera={selectedCamera} />}
          </div>
        </SheetContent>
      </Sheet>

      {/* Report Detail Sheet */}
      <Sheet open={!!selectedReport} onOpenChange={(open) => !open && handleCloseDetail()}>
        <SheetContent side={isMobile ? "bottom" : "right"} className="p-0 sm:max-w-md">
          <SheetHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-foreground flex items-center gap-2">
                <Binoculars className="w-5 h-5 text-blue-400" />
                Scout Report
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseDetail}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>
          <div className="p-4">
            {selectedReport && <ReportDetailCard report={selectedReport} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Detail card shown in the sheet when a report marker is clicked */
function ReportDetailCard({ report }: { report: CommunityReport }) {
  const config = reportTypeConfig[report.type] || reportTypeConfig.other;
  const Icon = config.icon;

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center", config.bgColor)}>
          <Icon className={cn("w-6 h-6", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-lg">{config.label}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{report.lat.toFixed(4)}, {report.lng.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* AI Verification Badge */}
      <div className={cn(
        "rounded-lg p-4",
        report.verifiedByAi
          ? "bg-blue-500/10 border border-blue-500/30"
          : "bg-amber-500/10 border border-amber-500/30"
      )}>
        <div className="flex items-start gap-3">
          {report.verifiedByAi ? (
            <Sparkles className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className={cn(
              "font-medium text-sm",
              report.verifiedByAi ? "text-blue-400" : "text-amber-400"
            )}>
              {report.verifiedByAi ? "AI Verified" : "Pending Review"}
            </p>
            {report.aiExplanation && (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {report.aiExplanation}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {report.description && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Description
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {report.description}
          </p>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-2">
        <Badge
          className={cn(
            "border",
            report.status === "verified" && "bg-blue-500/20 text-blue-400 border-blue-500/30",
            report.status === "pending" && "bg-amber-500/20 text-amber-400 border-amber-500/30",
            report.status === "resolved" && "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
          )}
        >
          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
        </Badge>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
        <Clock className="w-3 h-3" />
        <span>Reported {formatRelativeTime(report.timestamp)}</span>
      </div>
    </div>
  );
}

/** Compact report card for sidebar list */
function ReportCardCompact({ report, onClick }: { report: CommunityReport; onClick?: () => void }) {
  const config = reportTypeConfig[report.type] || reportTypeConfig.other;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm",
        "flex items-center gap-3 text-left transition-all duration-200",
        "hover:bg-card hover:border-border"
      )}
    >
      <div className={cn("flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center", config.bgColor)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">{config.label}</span>
          {report.verifiedByAi && (
            <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground truncate">
            {report.lat.toFixed(3)}, {report.lng.toFixed(3)}
          </span>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 border",
              report.status === "verified" && "bg-blue-500/20 text-blue-400 border-blue-500/30",
              report.status === "pending" && "bg-amber-500/20 text-amber-400 border-amber-500/30",
            )}
          >
            {report.status === "verified" ? "Verified" : "Pending"}
          </Badge>
        </div>
      </div>
    </button>
  );
}

interface StatBadgeProps {
  icon: typeof Camera;
  label: string;
  value: number;
  loading?: boolean;
  variant?: "default" | "warning" | "success";
}

function StatBadge({ icon: Icon, label, value, loading, variant = "default" }: StatBadgeProps) {
  const colorClasses = {
    default: "text-foreground",
    warning: "text-amber-400",
    success: "text-blue-400",
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
      <Icon className={cn("w-4 h-4", colorClasses[variant])} />
      <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span>
      {loading ? (
        <Skeleton className="w-6 h-4" />
      ) : (
        <span className={cn("text-sm font-semibold", colorClasses[variant])}>{value}</span>
      )}
    </div>
  );
}
