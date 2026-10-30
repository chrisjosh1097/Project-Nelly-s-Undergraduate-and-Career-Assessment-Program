import { ApiError, jsonError } from "@/lib/api";
import { verifyManualAdminRequest } from "@/lib/admin/session";
import { listAdminSubmissionPage } from "@/lib/submissions/store";
import { parseSubmissionFilters } from "@/lib/submissions/filters";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    verifyManualAdminRequest(request);
    const params = new URL(request.url).searchParams;
    const rawPage = params.get("page");
    const page = rawPage === null ? 1 : Number(rawPage);
    if (
      (rawPage !== null && !/^\d+$/.test(rawPage)) ||
      !Number.isSafeInteger(page) ||
      page < 1
    )
      throw new ApiError("Halaman tidak valid.", 400);
    const result = await listAdminSubmissionPage(
      parseSubmissionFilters(params),
      page,
    );
    return Response.json(result, {
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    return jsonError(error);
  }
}
