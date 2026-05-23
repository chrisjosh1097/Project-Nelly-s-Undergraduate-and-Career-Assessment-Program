import { adminSessionClearCookie } from "@/lib/admin/session";

export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    { ok: true },
    {
      headers: {
        "set-cookie": adminSessionClearCookie()
      }
    }
  );
}
