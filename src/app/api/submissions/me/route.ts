import { jsonError } from "@/lib/api";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";
import { getSubmissionByEmail } from "@/lib/submissions/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const decoded = await verifyFirebaseRequest(request);
    const submission = await getSubmissionByEmail(decoded.email!);
    if (!submission) {
      return Response.json({ error: "Submission belum ditemukan." }, { status: 404 });
    }
    return Response.json({ submission });
  } catch (error) {
    return jsonError(error);
  }
}
