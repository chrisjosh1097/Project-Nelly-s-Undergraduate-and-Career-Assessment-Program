import {
  adminSessionSetCookie,
  createAdminSessionToken,
  verifyAdminCredentials
} from "@/lib/admin/session";
import { jsonError } from "@/lib/api";
import { AuthError } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email ?? "";
    const password = body.password ?? "";

    if (!verifyAdminCredentials(email, password)) {
      const error = new AuthError("Email atau password admin salah.");
      error.status = 401;
      throw error;
    }

    const token = createAdminSessionToken(email);
    return Response.json(
      { ok: true },
      {
        headers: {
          "set-cookie": adminSessionSetCookie(token)
        }
      }
    );
  } catch (error) {
    return jsonError(error);
  }
}
