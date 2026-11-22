import { jsonError } from "@/lib/api";
import { verifyManualAdminRequest } from "@/lib/admin/session";
import { buildScoringMatrix } from "@/lib/admin/scoringMatrix";
export const runtime = "nodejs";
/** Admin-only, read-only scoring rubric. No student data. */
export async function GET(request: Request) {
  try {
    verifyManualAdminRequest(request);
    return Response.json(buildScoringMatrix(), {
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    return jsonError(error);
  }
}
