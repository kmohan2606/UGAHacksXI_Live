import { Link } from "react-router-dom";
import {
  Shield,
  Route,
  Camera,
  Leaf,
  ChevronDown,
  Trophy,
  ArrowRight,
  Eye,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";

const features = [
  {
    id: "guardian",
    title: "Guardian",
    subtitle: "AI-Powered Hazard Monitoring",
    description:
      "Real-time traffic camera analysis powered by Google Gemini AI. Our Guardian system continuously monitors Atlanta's road network, detecting hazards like potholes, debris, flooding, and construction zones before they become a danger to commuters.",
    icon: Shield,
    detailIcon: Eye,
    path: "/guardian",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/5",
    shadowColor: "shadow-blue-500/20",
    highlights: ["Real-time camera feeds", "AI hazard detection", "Severity scoring"],
  },
  {
    id: "routes",
    title: "Routes",
    subtitle: "Eco-Friendly Route Planning",
    description:
      "Smart route recommendations that factor in air quality, carbon emissions, and detected hazards. Our AI analyzes multiple route options and generates custom waypoints to steer you away from danger zones while minimizing your environmental footprint.",
    icon: Route,
    detailIcon: MapPin,
    path: "/routes",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/5",
    shadowColor: "shadow-emerald-500/20",
    highlights: ["Hazard-avoiding routes", "CO2 tracking", "AQI-aware planning"],
  },
  {
    id: "scout",
    title: "Scout",
    subtitle: "Community-Driven Reports",
    description:
      "Empower your commute community. Report infrastructure issues like broken EV chargers, blocked bike lanes, potholes, and flooding. Every report helps build a safer, more informed network for all Atlanta commuters.",
    icon: Camera,
    detailIcon: Users,
    path: "/scout",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/5",
    shadowColor: "shadow-blue-500/20",
    highlights: ["Community reporting", "Infrastructure tracking", "Crowd-verified data"],
  },
];

const sponsors = [
  { name: "MLH", label: "Major League Hacking" },
  { name: "Cox Automotive", label: "Cox Automotive" },
  { name: "State Farm", label: "State Farm" },
];

function FeatureSection({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const isReversed = index % 2 === 1;
  const Icon = feature.icon;
  const DetailIcon = feature.detailIcon;

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center py-20 px-4 md:px-8 lg:px-16"
    >
      <div
        className={cn(
          "max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center",
          "transition-all duration-700 ease-out",
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        )}
      >
        {/* Image placeholder */}
        <div className={cn(isReversed ? "lg:order-2" : "lg:order-1")}>
          <div
            className={cn(
              "relative aspect-video rounded-2xl overflow-hidden",
              "border border-border/50 shadow-2xl",
              feature.shadowColor,
              `bg-gradient-to-br ${feature.bgGradient}`
            )}
          >
            {/* Background fill */}
            <div className="absolute inset-0 bg-card/30 backdrop-blur-[1px]" />
            {/* Icon + label centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-xl`}
              >
                <Icon className="w-10 h-10 text-white" />
              </div>
              <span className="text-sm text-muted-foreground/60 font-medium">
                Screenshot coming soon
              </span>
            </div>
            {/* Decorative grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div className={cn(isReversed ? "lg:order-1" : "lg:order-2")}>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}
              >
                <DetailIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {feature.subtitle}
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              {feature.title}
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              {feature.description}
            </p>

            {/* Highlights */}
            <div className="flex flex-wrap gap-3">
              {feature.highlights.map((h) => (
                <span
                  key={h}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/50 text-muted-foreground border border-border/50"
                >
                  {h}
                </span>
              ))}
            </div>

            <Link to={feature.path}>
              <Button
                variant="ghost"
                className="group text-primary hover:text-primary hover:bg-primary/10 mt-2"
              >
                Explore {feature.title}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  const { ref, isInView } = useInView({ threshold: 0.2 });

  return (
    <section className="py-20 px-4" ref={ref}>
      <div
        className={cn(
          "max-w-4xl mx-auto text-center",
          "transition-all duration-700 ease-out",
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Leaf className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Ready to commute smarter?
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
          Start Your <span className="text-primary">Green</span> Journey
        </h2>

        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Join the movement toward safer, cleaner commutes across Georgia.
        </p>

        <Link to="/routes">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg rounded-xl shadow-lg shadow-primary/20 mb-16"
          >
            Plan Your Route
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>

        {/* Footer tagline */}
        <div className="border-t border-border/50 pt-8">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/40">
            <Leaf className="w-3 h-3" />
            <span>Powered by AI vision</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center relative px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Leaf className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Atlanta's Smart Commute Platform
              </span>
            </div>
          </div>

          <h1
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground mb-6 tracking-tight animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <span className="text-primary text-shiny-green">Green</span>Commute
            <br />
            <span className="text-muted-foreground/60">ATL</span>
          </h1>

          <p
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            Smart commute intelligence for{" "}
            <span className="text-foreground font-medium">safer</span>,{" "}
            <span className="text-primary font-medium">greener</span> Georgia
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <Link to="/routes">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/20"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/guardian">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg rounded-xl border-border/50"
              >
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-muted-foreground/40" />
        </div>
      </section>

      {/* Feature Sections */}
      {features.map((feature, index) => (
        <FeatureSection key={feature.id} feature={feature} index={index} />
      ))}

      {/* Footer / CTA */}
      <FooterSection />
    </div>
  );
}
