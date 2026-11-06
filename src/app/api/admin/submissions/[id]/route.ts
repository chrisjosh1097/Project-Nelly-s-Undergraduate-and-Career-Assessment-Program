import { ApiError, jsonError } from "@/lib/api";
import { verifyManualAdminRequest } from "@/lib/admin/session";
import { getSubmissionById } from "@/lib/submissions/store";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    verifyManualAdminRequest(request);
    // Next has already decoded this segment. Only accept the application's URL-safe IDs.
    const { id } = await context.params;
    if (!id || !/^[A-Za-z0-9_-]{1,1500}$/.test(id))
      throw new ApiError("ID submission tidak valid.", 400);
    const submission = await getSubmissionById(id);
    if (!submission) throw new ApiError("Submission tidak ditemukan.", 404);
    return Response.json(
      { submission },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
