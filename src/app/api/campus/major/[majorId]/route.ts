import { CAMPUS_SOURCE_LINE, campusesForMajor } from "@/lib/campus/catalog";
import { CAMPUS_CACHE_HEADERS, invalidCampusRequest, isDegree } from "@/lib/campus/request";

export const runtime = "nodejs";

const MAJOR_ID = /^[a-z0-9_]{1,64}$/;

export async function GET(request: Request, context: { params: Promise<{ majorId: string }> }) {
  const { majorId } = await context.params;
  if (!MAJOR_ID.test(majorId)) return invalidCampusRequest();

  const url = new URL(request.url);
  const degrees = url.searchParams.getAll("degree");
  if (degrees.some((degree) => !isDegree(degree))) return invalidCampusRequest();
  const preferences = url.searchParams.getAll("pref").filter((pref) => pref.length <= 60).slice(0, 10);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "6", 10);

  const result = campusesForMajor(majorId, {
    degreeTypes: degrees,
    preferences,
    limit: Number.isFinite(limit) ? limit : 6,
  });
  return Response.json({ ...result, source: CAMPUS_SOURCE_LINE }, { headers: CAMPUS_CACHE_HEADERS });
}
