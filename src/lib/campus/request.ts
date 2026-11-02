import type { CampusType, Degree } from "./normalize";

export const CAMPUS_CACHE_HEADERS = { "Cache-Control": "public, max-age=3600" };
const DEGREES = new Set<string>(["D3", "D4", "S1"]);
const TYPES = new Set<string>(["Negeri", "Swasta/Lainnya"]);

export function invalidCampusRequest(): Response {
  return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
}

export function isDegree(value: string): value is Degree {
  return DEGREES.has(value);
}

export function isCampusType(value: string): value is CampusType {
  return TYPES.has(value);
}
