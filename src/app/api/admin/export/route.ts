import { jsonError } from "@/lib/api";
import { verifyManualAdminRequest } from "@/lib/admin/session";
import { listSubmissions } from "@/lib/submissions/store";
import { parseSubmissionFilters } from "@/lib/submissions/filters";
import { serializeSubmissionsCsv } from "@/lib/submissions/csv";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    verifyManualAdminRequest(request);
    const submissions = await listSubmissions(
      parseSubmissionFilters(new URL(request.url).searchParams),
    );
    return new Response(serializeSubmissionsCsv(submissions), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition":
          'attachment; filename="project-nelly-submissions.csv"',
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
