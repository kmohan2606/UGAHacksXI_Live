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
      <Card className="p-6 border-2 border-orange-500/30 bg-orange-500/5">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center rounded-full p-3 bg-orange-500/20">
            <CheckCircle2 className="h-8 w-8 text-orange-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              Report Submitted!
            </h3>
            <p className="text-sm text-muted-foreground">
              Thank you for helping improve Atlanta's infrastructure
            </p>
          </div>

          {/* Verification Result */}
          <div
            className={cn(
              "rounded-lg p-4 text-left",
              submittedReport.verifiedByAi
                ? "bg-emerald-500/10 border border-emerald-500/30"
                : "bg-amber-500/10 border border-amber-500/30"
            )}
          >
            <div className="flex items-start gap-3">
              {submittedReport.verifiedByAi ? (
                <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p
                  className={cn(
                    "font-medium text-sm",
                    submittedReport.verifiedByAi
                      ? "text-emerald-400"
                      : "text-amber-400"
                  )}
                >
                  {submittedReport.verifiedByAi
                    ? "AI Verified"
                    : "Pending Review"}
                </p>
                {submittedReport.aiExplanation ? (
                  <p className="text-sm text-foreground/80">
                    {submittedReport.aiExplanation}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your report has been submitted and will be reviewed shortly.
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleReset}
            className="bg-orange-500 hover:bg-orange-600 text-white"
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
        <label className="text-sm font-medium text-foreground">
          Additional Details (optional)
        </label>
        <Textarea
          placeholder="Describe the issue in more detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="resize-none bg-card/50 border-border/50"
        />
      </div>

      {/* Error Message */}
      {createReport.isError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3">
          <p className="text-sm text-destructive">
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
          "bg-orange-500 hover:bg-orange-600 text-white",
          "disabled:bg-secondary disabled:text-muted-foreground"
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
        <p className="text-xs text-muted-foreground text-center">
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
