import { Link } from "react-router-dom";
import {
  Shield,
  Route,
  Camera,
  Leaf,
  AlertTriangle,
  Wind,
  ChevronRight,
  Zap,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCameras, useCameraStats } from "@/hooks/useCameras";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Mock AQI data - in real app this would come from an API
const mockAQI = {
  value: 42,
  label: "Good",
  color: "text-emerald-400",
};

const quickActions = [
  {
    icon: Route,
    title: "Plan a Route",
    description: "AI-optimized eco-friendly navigation",
    path: "/routes",
    color: "from-emerald-500 to-teal-500",
    shadowColor: "shadow-emerald-500/20",
  },
  {
    icon: Shield,
    title: "Guardian Status",
    description: "Real-time hazard monitoring",
    path: "/guardian",
    color: "from-blue-500 to-cyan-500",
    shadowColor: "shadow-blue-500/20",
  },
  {
    icon: Camera,
    title: "Report Issue",
    description: "Help improve Atlanta's roads",
    path: "/scout",
    color: "from-amber-500 to-orange-500",
    shadowColor: "shadow-amber-500/20",
  },
];

const sponsors = [
  { name: "MLH", label: "Major League Hacking" },
  { name: "Cox Automotive", label: "Cox Automotive" },
  { name: "State Farm", label: "State Farm" },
];

export default function Home() {
  const { data: cameras, isLoading } = useCameras();
  const stats = useCameraStats(cameras);

  // Get active hazards for preview
  const activeHazards = cameras
    ?.filter((cam) => cam.currentStatus.hazard && cam.currentStatus.type !== "Clear")
    .slice(0, 3) ?? [];

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <section className="relative px-4 pt-8 pb-12 md:pt-16 md:pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Leaf className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">
                Atlanta's Smart Commute Platform
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight">
              <span className="text-primary">Green</span>Commute ATL
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Smart commute intelligence for{" "}
              <span className="text-foreground font-medium">safer</span>,{" "}
              <span className="text-primary font-medium">greener</span> Georgia
            </p>
          </div>

          {/* Status Summary Cards */}
          <div
            className="grid grid-cols-3 gap-3 md:gap-4 max-w-lg mx-auto mb-10 animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <StatusCard
              icon={<AlertTriangle className="w-4 h-4" />}
              label="Active Hazards"
              value={stats.activeHazards}
              isLoading={isLoading}
              variant="warning"
            />
            <StatusCard
              icon={<Wind className="w-4 h-4" />}
              label="AQI"
              value={mockAQI.value}
              sublabel={mockAQI.label}
              isLoading={false}
              variant="success"
            />
            <StatusCard
              icon={<Shield className="w-4 h-4" />}
              label="Cameras"
              value={stats.totalCameras}
              isLoading={isLoading}
              variant="default"
            />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 pb-10">
        <div className="max-w-4xl mx-auto">
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            {quickActions.map((action, index) => (
              <Link key={action.path} to={action.path}>
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${100 * (index + 1)}ms` }}
                >
                  <Card
                    className={cn(
                      "group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm",
                      "hover:bg-card/80 transition-all duration-300 cursor-pointer h-full",
                      action.shadowColor,
                      "hover:shadow-lg"
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}
                        >
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {action.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Alerts */}
      {activeHazards.length > 0 && (
        <section className="px-4 pb-10">
          <div className="max-w-4xl mx-auto">
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "300ms" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-semibold text-foreground">Active Alerts</h2>
                </div>
                <Link to="/guardian">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                    View all
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {activeHazards.map((hazard, index) => (
                  <div
                    key={hazard.camId}
                    className="animate-fade-in-left"
                    style={{ animationDelay: `${100 * index}ms` }}
                  >
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="destructive"
                                className="text-xs px-2 py-0"
                              >
                                {hazard.currentStatus.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Severity: {hazard.currentStatus.severity}/10
                              </span>
                            </div>
                            <p className="text-sm text-foreground truncate">
                              {hazard.locationName}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sponsors/Awards */}
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div
            className="text-center animate-fade-in"
            style={{ animationDelay: "400ms" }}
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Hackathon Project
              </span>
            </div>

            <div className="flex items-center justify-center gap-8 flex-wrap">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.name}
                  className="text-muted-foreground/60 text-sm font-medium hover:text-muted-foreground transition-colors"
                >
                  {sponsor.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel?: string;
  isLoading: boolean;
  variant: "default" | "warning" | "success";
}

function StatusCard({ icon, label, value, sublabel, isLoading, variant }: StatusCardProps) {
  const variantStyles = {
    default: "text-foreground",
    warning: "text-amber-400",
    success: "text-emerald-400",
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-3 md:p-4 text-center">
        <div className={`inline-flex mb-2 ${variantStyles[variant]}`}>{icon}</div>
        {isLoading ? (
          <Skeleton className="h-8 w-12 mx-auto mb-1" />
        ) : (
          <div className={`text-2xl md:text-3xl font-bold ${variantStyles[variant]}`}>
            {value}
          </div>
        )}
        {sublabel ? (
          <div className={`text-xs font-medium ${variantStyles[variant]}`}>{sublabel}</div>
        ) : null}
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}
