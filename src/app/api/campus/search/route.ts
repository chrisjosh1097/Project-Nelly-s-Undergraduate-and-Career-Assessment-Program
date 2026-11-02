import { CAMPUS_SOURCE_LINE, listProvinces, searchPrograms } from "@/lib/campus/catalog";
import { CAMPUS_CACHE_HEADERS, invalidCampusRequest, isCampusType, isDegree } from "@/lib/campus/request";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const text = (params.get("q") ?? "").trim();
  const province = (params.get("province") ?? "").trim();
  const degree = params.get("degree") ?? "";
  const type = params.get("type") ?? "";
  const rawPage = params.get("page") ?? "1";
  const page = /^\d{1,3}$/.test(rawPage) ? Number(rawPage) : NaN;

  if (text.length > 60 || province.length > 60) return invalidCampusRequest();
  if (!(page >= 1 && page <= 500)) return invalidCampusRequest();
  if (degree && !isDegree(degree)) return invalidCampusRequest();
  if (type && !isCampusType(type)) return invalidCampusRequest();

  const result = searchPrograms({
    text,
    page,
    ...(province ? { province } : {}),
    ...(degree && isDegree(degree) ? { degree } : {}),
    ...(type && isCampusType(type) ? { type } : {}),
  });
  return Response.json(
    { ...result, provinces: listProvinces(), source: CAMPUS_SOURCE_LINE },
    { headers: CAMPUS_CACHE_HEADERS },
  );
}
