import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Shield, Route, Camera, Leaf, LayoutGrid, X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { CursorTrail } from "@/components/effects/CursorTrail";

interface NavItem {
  icon: typeof Home;
  label: string;
  description: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", description: "Dashboard overview", path: "/" },
  { icon: Shield, label: "Guardian", description: "Hazard monitoring", path: "/guardian" },
  { icon: Route, label: "Routes", description: "Eco route planner", path: "/routes" },
  { icon: Camera, label: "Scout", description: "Community reports", path: "/scout" },
];

export function AppLayout() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine cursor trail hue based on current route
  // Guardian/Scout = Blue (210), Routes = Green (155), Home = Green (155)
  const getCursorHue = () => {
    const path = location.pathname;
    if (path === "/guardian" || path === "/scout") return 210; // Blue
    return 155; // Green (default for Routes and Home)
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mystical grid background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid pattern */}
        <div className="mystical-grid absolute inset-0" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-teal-950/10" />
        {/* Floating orbs with drift animations */}
        <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-drift-1" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-teal-500/5 rounded-full blur-3xl animate-drift-2" />
        <div
          className="absolute top-[50%] left-[60%] w-64 h-64 bg-emerald-500/[0.03] rounded-full blur-3xl animate-drift-1"
          style={{ animationDelay: "-10s" }}
        />
        {/* Glow intersection points */}
        <div className="absolute top-[20%] left-[30%] w-1.5 h-1.5 bg-primary/40 rounded-full blur-[2px] animate-pulse-glow" />
        <div
          className="absolute top-[60%] right-[25%] w-1.5 h-1.5 bg-primary/30 rounded-full blur-[2px] animate-pulse-glow"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-[40%] left-[70%] w-1 h-1 bg-teal-400/30 rounded-full blur-[2px] animate-pulse-glow"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute bottom-[30%] left-[15%] w-1.5 h-1.5 bg-primary/25 rounded-full blur-[2px] animate-pulse-glow"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-[80%] right-[40%] w-1 h-1 bg-emerald-400/30 rounded-full blur-[2px] animate-pulse-glow"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* Cursor trail with route-based color */}
      <CursorTrail hue={getCursorHue()} />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col",
          "bg-sidebar-background/80 backdrop-blur-xl border-r border-border/50",
          "transition-all duration-300 ease-in-out overflow-hidden"
        )}
        style={{ width: sidebarExpanded ? 240 : 64 }}
      >
        {/* Waffle menu toggle */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className={cn(
            "flex items-center h-16 flex-shrink-0",
            "text-muted-foreground hover:text-primary transition-colors duration-200",
            sidebarExpanded ? "px-5 gap-3" : "justify-center w-16"
          )}
        >
          <LayoutGrid className="w-5 h-5 flex-shrink-0" />
          {sidebarExpanded && (
            <span className="text-sm font-bold text-foreground tracking-tight whitespace-nowrap">
              LumenRoute AI
            </span>
          )}
        </button>

        {/* Nav items */}
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-xl transition-all duration-200 group",
                  sidebarExpanded ? "px-3 py-3" : "justify-center py-3",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
                title={!sidebarExpanded ? item.label : undefined}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-all flex-shrink-0",
                    isActive
                      ? "bg-primary/20"
                      : "bg-secondary/50 group-hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {sidebarExpanded && (
                  <div className="flex flex-col min-w-0 overflow-hidden">
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {item.description}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-border/50">
          <div
            className={cn(
              "flex items-center gap-2 text-xs text-muted-foreground",
              !sidebarExpanded && "justify-center"
            )}
          >
            <Leaf className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
            {sidebarExpanded && <span className="truncate">Powered by AI vision</span>}
          </div>
        </div>
      </aside>

      {/* Mobile hamburger button */}
      {!mobileMenuOpen && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={cn(
            "fixed top-4 left-4 z-50 md:hidden",
            "w-10 h-10 rounded-xl bg-card/60 backdrop-blur-lg border border-border/50",
            "flex items-center justify-center",
            "text-muted-foreground hover:text-primary transition-colors duration-200",
            "shadow-lg shadow-black/20"
          )}
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile full-screen overlay menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-all duration-300",
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-background/90 backdrop-blur-xl"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-card/60 backdrop-blur-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Menu content */}
        <div
          className={cn(
            "relative z-10 flex flex-col items-center justify-center h-full gap-4 px-6",
            "transition-all duration-300",
            mobileMenuOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground tracking-tight">
                LumenRoute AI
              </span>
              <span className="text-[10px] font-medium text-primary/80 tracking-wider uppercase">
                Smart Commute
              </span>
            </div>
          </div>

          {/* Nav items */}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl w-full max-w-xs transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl transition-all",
                    isActive ? "bg-primary/20" : "bg-secondary/50"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold">{item.label}</span>
                  <span className="text-sm text-muted-foreground">{item.description}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main
        className={cn(
          "relative z-10 min-h-screen",
          "transition-all duration-300 ease-in-out",
          "md:ml-16"
        )}
        style={!isMobile && sidebarExpanded ? { marginLeft: 240 } : undefined}
      >
        <Outlet />
      </main>
    </div>
  );
}
