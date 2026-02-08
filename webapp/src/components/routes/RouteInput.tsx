import { useState } from "react";
import { MapPin, Navigation, Leaf, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { RouteRequest } from "../../../../backend/src/types";

interface RouteInputProps {
  onSubmit: (request: RouteRequest) => void;
  isLoading?: boolean;
}

export function RouteInput({ onSubmit, isLoading = false }: RouteInputProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [preferEco, setPreferEco] = useState(false);
  const [avoidHazards, setAvoidHazards] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    onSubmit({
      origin: origin.trim(),
      destination: destination.trim(),
      preferEco,
      avoidHazards,
    });
  };

  const isValid = origin.trim().length > 0 && destination.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
          <Input
            type="text"
            placeholder="Your location"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="pl-11 h-12 bg-card/50 border-border/50 focus:border-emerald-500 focus:ring-emerald-500/20 text-foreground"
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
          <Input
            type="text"
            placeholder="Where to?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="pl-11 h-12 bg-card/50 border-border/50 focus:border-emerald-500 focus:ring-emerald-500/20 text-foreground"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-emerald-400" />
            <Label htmlFor="prefer-eco" className="text-sm font-medium text-foreground cursor-pointer">
              Prefer eco-friendly route
            </Label>
          </div>
          <Switch
            id="prefer-eco"
            checked={preferEco}
            onCheckedChange={setPreferEco}
            disabled={isLoading}
            className={cn(
              "data-[state=checked]:bg-emerald-600"
            )}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <Label htmlFor="avoid-hazards" className="text-sm font-medium text-foreground cursor-pointer">
              Avoid hazards
            </Label>
          </div>
          <Switch
            id="avoid-hazards"
            checked={avoidHazards}
            onCheckedChange={setAvoidHazards}
            disabled={isLoading}
            className={cn(
              "data-[state=checked]:bg-amber-500"
            )}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-base transition-all duration-200 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Planning Route...
          </>
        ) : (
          "Plan Route"
        )}
      </Button>
    </form>
  );
}
