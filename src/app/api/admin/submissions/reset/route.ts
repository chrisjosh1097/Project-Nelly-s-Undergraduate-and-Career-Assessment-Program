import { jsonError, readJsonBody } from "@/lib/api";
import { verifyManualAdminRequest } from "@/lib/admin/session";
import { AuthError } from "@/lib/firebase/admin";
import { deleteSubmissionByEmail } from "@/lib/submissions/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    verifyManualAdminRequest(request);
    const body = (await readJsonBody(request, 2_000)) as { email?: string };
    const email = body.email?.trim() ?? "";

    if (!email || !email.includes("@")) {
      const error = new AuthError("Masukkan email yang valid untuk dihapus attempt-nya.");
      error.status = 400;
      throw error;
    }

    const result = await deleteSubmissionByEmail(email);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
