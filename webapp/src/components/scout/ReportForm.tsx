import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ReportTypeSelector } from "./ReportTypeSelector";
import { PhotoCapture } from "./PhotoCapture";
import { LocationPicker } from "./LocationPicker";
import { useCreateReport } from "@/hooks/useReports";
import type { ReportType, CommunityReport } from "../../../../backend/src/types";
import {
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

interface ReportFormProps {
  onSuccess?: (report: CommunityReport) => void;
}

export function ReportForm({ onSuccess }: ReportFormProps) {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [description, setDescription] = useState("");
  const [submittedReport, setSubmittedReport] = useState<CommunityReport | null>(
    null
  );

  const createReport = useCreateReport();

  const isValid = selectedType !== null && location !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || !location) return;

    try {
      const report = await createReport.mutateAsync({
        type: selectedType,
        lat: location.lat,
        lng: location.lng,
        description: description.trim() || undefined,
        imageBase64: imageBase64 || undefined,
      });

      setSubmittedReport(report);
      onSuccess?.(report);
    } catch (error) {
      console.error("Failed to create report:", error);
    }
  };

  const handleReset = () => {
    setSelectedType(null);
    setImageBase64(null);
    setLocation(null);
    setDescription("");
    setSubmittedReport(null);
    createReport.reset();
  };

  // Success state
  if (submittedReport) {
    return (
      <Card className="p-6 border-2 border-green-200 bg-gradient-to-b from-green-50 to-white">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center rounded-full p-3 bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-green-800">
              Report Submitted!
            </h3>
            <p className="text-sm text-gray-600">
              Thank you for helping improve Atlanta's infrastructure
            </p>
          </div>

          {/* Verification Result */}
          <div
            className={cn(
              "rounded-lg p-4 text-left",
              submittedReport.verifiedByAi
                ? "bg-green-100 border border-green-200"
                : "bg-amber-50 border border-amber-200"
            )}
          >
            <div className="flex items-start gap-3">
              {submittedReport.verifiedByAi ? (
                <Sparkles className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p
                  className={cn(
                    "font-medium text-sm",
                    submittedReport.verifiedByAi
                      ? "text-green-700"
                      : "text-amber-700"
                  )}
                >
                  {submittedReport.verifiedByAi
                    ? "AI Verified"
                    : "Pending Review"}
                </p>
                {submittedReport.aiExplanation ? (
                  <p className="text-sm text-gray-600">
                    {submittedReport.aiExplanation}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Your report has been submitted and will be reviewed shortly.
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleReset}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Submit Another Report
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Report Type */}
      <ReportTypeSelector
        selectedType={selectedType}
        onSelect={setSelectedType}
      />

      {/* Photo Capture */}
      <PhotoCapture imageBase64={imageBase64} onImageChange={setImageBase64} />

      {/* Location */}
      <LocationPicker location={location} onLocationChange={setLocation} />

      {/* Description */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Additional Details (optional)
        </label>
        <Textarea
          placeholder="Describe the issue in more detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Error Message */}
      {createReport.isError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-600">
            {createReport.error instanceof Error
              ? createReport.error.message
              : "Failed to submit report. Please try again."}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isValid || createReport.isPending}
        className={cn(
          "w-full h-12 text-base font-medium gap-2",
          "bg-green-600 hover:bg-green-700 text-white",
          "disabled:bg-gray-300 disabled:text-gray-500"
        )}
      >
        {createReport.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Submit Report
          </>
        )}
      </Button>

      {/* Validation Hint */}
      {!isValid && (
        <p className="text-xs text-gray-500 text-center">
          {!selectedType && !location
            ? "Select a report type and set your location to submit"
            : !selectedType
            ? "Select a report type to continue"
            : "Set your location to continue"}
        </p>
      )}
    </form>
  );
}
