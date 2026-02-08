import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Loader2, Check } from "lucide-react";

// Default Atlanta coordinates
const ATLANTA_DEFAULT = {
  lat: 33.749,
  lng: -84.388,
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
  const [manualAddress, setManualAddress] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: "Current location",
        });
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setLocationError(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [onLocationChange]);

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
        <label className="text-sm font-medium text-gray-700">Location</label>
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-green-100 text-green-600 shrink-0">
              <Check className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-700 text-sm">
                {location.address || "Location selected"}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-green-600 hover:text-green-700 hover:bg-green-100 shrink-0"
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
      <label className="text-sm font-medium text-gray-700">Location</label>
      <div className="space-y-3">
        {/* Current Location Button */}
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start gap-3 h-auto py-3",
            "border-2 hover:border-green-400 hover:bg-green-50/50"
          )}
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          ) : (
            <Navigation className="h-5 w-5 text-green-600" />
          )}
          <div className="text-left">
            <div className="font-medium">
              {isLocating ? "Getting location..." : "Use Current Location"}
            </div>
            <div className="text-xs text-gray-500">
              Allow location access for accurate reporting
            </div>
          </div>
        </Button>

        {locationError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-600">{locationError}</p>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-red-600 p-0 h-auto mt-1"
              onClick={handleUseAtlantaDefault}
            >
              Use Atlanta default instead
            </Button>
          </div>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">or enter address</span>
          </div>
        </div>

        {/* Manual Address Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              className="pl-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleManualSubmit}
            disabled={!manualAddress.trim()}
          >
            Set
          </Button>
        </div>
      </div>
    </div>
  );
}
