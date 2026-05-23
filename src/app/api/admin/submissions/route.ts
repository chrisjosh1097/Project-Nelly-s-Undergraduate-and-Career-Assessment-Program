import { jsonError } from "@/lib/api";
import { verifyManualAdminRequest } from "@/lib/admin/session";
import { listSubmissions } from "@/lib/submissions/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    verifyManualAdminRequest(request);
    const url = new URL(request.url);
    const submissions = await listSubmissions({
      school: url.searchParams.get("school") ?? undefined,
      className: url.searchParams.get("className") ?? undefined,
      topRecommendation: url.searchParams.get("topRecommendation") ?? undefined,
      cluster: url.searchParams.get("cluster") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      dateFrom: url.searchParams.get("dateFrom") ?? undefined,
      dateTo: url.searchParams.get("dateTo") ?? undefined
    });

    return Response.json({ submissions });
  } catch (error) {
    return jsonError(error);
  }
}
