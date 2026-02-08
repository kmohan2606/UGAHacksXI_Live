import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, RotateCcw } from "lucide-react";

interface PhotoCaptureProps {
  imageBase64: string | null;
  onImageChange: (base64: string | null) => void;
}

export function PhotoCapture({ imageBase64, onImageChange }: PhotoCaptureProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      try {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert("Please select an image file");
          return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert("Image must be less than 10MB");
          return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          // Remove data URL prefix to get just the base64 string
          const base64 = result.split(",")[1];
          onImageChange(base64);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error processing image:", error);
        alert("Failed to process image");
      } finally {
        setIsProcessing(false);
      }
    },
    [onImageChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleRemove = () => {
    onImageChange(null);
  };

  if (imageBase64) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Photo</label>
        <div className="relative rounded-xl overflow-hidden border-2 border-green-200 bg-green-50">
          <img
            src={`data:image/jpeg;base64,${imageBase64}`}
            alt="Report preview"
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-white/90 hover:bg-white shadow-md"
              onClick={handleCameraClick}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8 shadow-md"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Hidden inputs for retake */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">
        Add a Photo (optional)
      </label>
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all",
          isProcessing
            ? "border-green-400 bg-green-50"
            : "border-gray-300 hover:border-green-400 hover:bg-green-50/30"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full p-4 bg-gray-100 text-gray-400">
            <Camera className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">
              {isProcessing ? "Processing..." : "Add a photo to help verify the issue"}
            </p>
            <p className="text-xs text-gray-500">
              Photos help our AI verify reports faster
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCameraClick}
              disabled={isProcessing}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={isProcessing}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
      </div>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
