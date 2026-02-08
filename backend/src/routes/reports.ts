import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type {
  CommunityReport,
  GeminiScoutVerification,
  ReportType,
} from "../types";
import { CommunityReportSchema, CreateReportRequestSchema } from "../types";
import { verifyReportImage, isGeminiConfigured } from "../gemini";
import { getMockScoutVerification } from "../mockData";

const reportsRouter = new Hono();

// In-memory storage for reports (MVP)
const reports: CommunityReport[] = [];

/**
 * Generate a unique report ID
 */
function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Query param schema for filtering reports
const ReportFilterSchema = z.object({
  status: z.enum(["pending", "verified", "resolved"]).optional(),
});

/**
 * GET /api/reports
 * Returns all community reports, optionally filtered by status
 */
reportsRouter.get("/", zValidator("query", ReportFilterSchema), (c) => {
  const { status } = c.req.valid("query");

  let filteredReports = reports;

  if (status) {
    filteredReports = reports.filter((report) => report.status === status);
  }

  // Sort by most recent first
  const sortedReports = [...filteredReports].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return c.json({ data: sortedReports });
});

/**
 * POST /api/reports
 * Creates a new community report with real Gemini Vision AI verification
 */
reportsRouter.post(
  "/",
  zValidator("json", CreateReportRequestSchema),
  async (c) => {
    const body = c.req.valid("json");

    const reportId = generateReportId();
    const timestamp = new Date().toISOString();

    // TODO: If imageBase64 is provided, upload to cloud storage (e.g., GCS, S3)
    // and store the resulting URL in imageUrl
    let imageUrl: string | undefined;
    if (body.imageBase64) {
      imageUrl = `https://storage.lumenroute.ai/reports/${reportId}.jpg`;
    }

    // Perform AI verification if image is provided (with mock fallback)
    let verifiedByAi = false;
    let aiExplanation: string | undefined;
    let status: "pending" | "verified" | "resolved" = "pending";

    if (body.imageBase64) {
      let verification: GeminiScoutVerification;

      if (isGeminiConfigured()) {
        try {
          console.log(
            `[Reports] Running Gemini Vision verification for report ${reportId} (type: ${body.type})`
          );

          verification = await verifyReportImage(
            body.type,
            body.imageBase64
          );
        } catch (error) {
          console.warn(
            `[Reports] Gemini verification failed for ${reportId}, using mock:`,
            error
          );
          // Fallback to mock verification
          verification = getMockScoutVerification(body.type);
        }
      } else {
        // Gemini not configured - use mock verification for demo
        console.log(`[Reports] Gemini not configured, using mock verification for ${reportId}`);
        verification = getMockScoutVerification(body.type);
      }

      verifiedByAi = verification.verified;
      aiExplanation = verification.explanation;
      status = verification.verified ? "verified" : "pending";

      console.log(
        `[Reports] Verification result: ${verification.verified ? "VERIFIED" : "NOT VERIFIED"} (confidence: ${verification.confidence})`
      );
    }

    const newReport: CommunityReport = {
      reportId,
      type: body.type,
      description: body.description,
      lat: body.lat,
      lng: body.lng,
      imageUrl,
      verifiedByAi,
      aiExplanation,
      timestamp,
      status,
    };

    // Validate the report against the schema before storing
    const validatedReport = CommunityReportSchema.parse(newReport);
    reports.push(validatedReport);

    return c.json({ data: validatedReport }, 201);
  }
);

/**
 * GET /api/reports/:reportId
 * Returns a single report's details
 */
reportsRouter.get("/:reportId", (c) => {
  const reportId = c.req.param("reportId");

  const report = reports.find((r) => r.reportId === reportId);

  if (!report) {
    return c.json(
      { error: { message: "Report not found", code: "NOT_FOUND" } },
      404
    );
  }

  return c.json({ data: report });
});

/**
 * PATCH /api/reports/:reportId/resolve
 * Marks a report as resolved
 */
reportsRouter.patch("/:reportId/resolve", (c) => {
  const reportId = c.req.param("reportId");

  const reportIndex = reports.findIndex((r) => r.reportId === reportId);

  if (reportIndex === -1) {
    return c.json(
      { error: { message: "Report not found", code: "NOT_FOUND" } },
      404
    );
  }

  const existingReport = reports[reportIndex]!;
  const updatedReport: CommunityReport = {
    reportId: existingReport.reportId,
    type: existingReport.type,
    description: existingReport.description,
    lat: existingReport.lat,
    lng: existingReport.lng,
    imageUrl: existingReport.imageUrl,
    verifiedByAi: existingReport.verifiedByAi,
    aiExplanation: existingReport.aiExplanation,
    timestamp: existingReport.timestamp,
    status: "resolved",
  };
  reports[reportIndex] = updatedReport;

  return c.json({ data: updatedReport });
});

export { reportsRouter };
