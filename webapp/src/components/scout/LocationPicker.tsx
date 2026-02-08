import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Loader2, Check } from "lucide-react";

// Default coordinates (UGA area)
const ATLANTA_DEFAULT = {
  lat: 33.95184758240007,
  lng: -83.37598727067142,
};

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationPickerProps {
  location: LocationData | null;
  onLocationChange: (location: LocationData | null) => void;
}

export function LocationPicker({
  location,
  onLocationChange,
}: LocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;
  const gotHighAccuracy = useRef(false);

  const handleUseCurrentLocation = useCallback(() => {
    setIsLocating(true);
    setLocationError(null);
    gotHighAccuracy.current = false;

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    // Step 1: Get a fast, low-accuracy position immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Got a fast fix — show it right away
        onLocationChangeRef.current({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: "Current location (approximate)",
        });
        setIsLocating(false);

        // Step 2: Refine with high-accuracy GPS in background
        if (!gotHighAccuracy.current) {
          setIsRefining(true);
          navigator.geolocation.getCurrentPosition(
            (precisePosition) => {
              gotHighAccuracy.current = true;
              onLocationChangeRef.current({
                lat: precisePosition.coords.latitude,
                lng: precisePosition.coords.longitude,
                address: "Current location",
              });
              setIsRefining(false);
            },
            () => {
              // High-accuracy failed — the fast position is good enough
              setIsRefining(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 20000,
              maximumAge: 0,
            }
          );
        }
      },
      () => {
        // Geolocation failed — auto-fallback to default coordinates
        onLocationChangeRef.current({
          lat: ATLANTA_DEFAULT.lat,
          lng: ATLANTA_DEFAULT.lng,
          address: "Default location (auto)",
        });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000,
      }
    );
  }, []);

  const handleUseAtlantaDefault = () => {
    onLocationChange({
      lat: ATLANTA_DEFAULT.lat,
      lng: ATLANTA_DEFAULT.lng,
      address: "Downtown Atlanta",
    });
  };

  const handleManualSubmit = () => {
    if (manualAddress.trim()) {
      // For MVP, use Atlanta coordinates with the manual address
      onLocationChange({
        lat: ATLANTA_DEFAULT.lat,
        lng: ATLANTA_DEFAULT.lng,
        address: manualAddress.trim(),
      });
    }
  };

  const handleClear = () => {
    onLocationChange(null);
    setManualAddress("");
    setLocationError(null);
  };

  if (location) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Location</label>
        <div className="rounded-xl border-2 border-orange-500/30 bg-orange-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-orange-500/20 text-orange-400 shrink-0">
              {isRefining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-orange-400 text-sm">
                {location.address || "Location selected"}
              </p>
              <p className="text-xs text-orange-400/70 mt-0.5">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                {isRefining ? " · Refining accuracy..." : ""}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 shrink-0"
            >
              Change
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Location</label>
      <div className="space-y-3">
        {/* Current Location Button */}
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start gap-3 h-auto py-3",
            "border-2 border-border/50 hover:border-orange-500/50 hover:bg-orange-500/5"
          )}
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
          ) : (
            <Navigation className="h-5 w-5 text-orange-400" />
          )}
          <div className="text-left">
            <div className="font-medium text-foreground">
              {isLocating ? "Getting location..." : "Use Current Location"}
            </div>
            <div className="text-xs text-muted-foreground">
              Allow location access for accurate reporting
            </div>
          </div>
        </Button>

        {locationError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3">
            <p className="text-sm text-destructive">{locationError}</p>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-destructive p-0 h-auto mt-1"
              onClick={handleUseAtlantaDefault}
            >
              Use Atlanta default instead
            </Button>
          </div>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or enter address</span>
          </div>
        </div>

        {/* Manual Address Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter address or intersection"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleManualSubmit();
                }
              }}
              className="pl-10 bg-card/50 border-border/50"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleManualSubmit}
            disabled={!manualAddress.trim()}
            className="border-border/50"
          >
            Set
          </Button>
        </div>
      </div>
    </div>
  );
}
