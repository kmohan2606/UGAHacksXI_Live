import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Shield, Route, Camera, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Shield, label: "Guardian", path: "/guardian" },
  { icon: Route, label: "Routes", path: "/routes" },
  { icon: Camera, label: "Scout", path: "/scout" },
];

export function AppLayout() {
  const isMobile = useIsMobile();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Atmospheric gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-background to-teal-950/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-40 flex-shrink-0">
        <div className="border-b border-border/50 bg-card/50 backdrop-blur-xl">
          <div className="flex items-center justify-between h-14 px-4 md:px-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
                  <Leaf className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="absolute -inset-1 bg-primary/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-foreground tracking-tight leading-none">
                  GreenCommute ATL
                </span>
                <span className="text-[10px] font-medium text-primary/80 tracking-wider uppercase">
                  Guardian Edition
                </span>
              </div>
            </Link>

            {/* Desktop nav links in header */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                      "transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-sidebar-background/50 backdrop-blur-sm">
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                      "transition-all duration-200 group",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                        isActive
                          ? "bg-primary/20"
                          : "bg-secondary/50 group-hover:bg-secondary"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar footer */}
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Leaf className="w-3.5 h-3.5 text-primary/60" />
                <span>Powered by AI vision</span>
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNav />}
    </div>
  );
}
