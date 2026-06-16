import { jsonError } from "@/lib/api";
import { verifyFirebaseRequest } from "@/lib/firebase/admin";
import { getSubmissionByEmail } from "@/lib/submissions/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const decoded = await verifyFirebaseRequest(request);
    const submission = await getSubmissionByEmail(decoded.email!);
    if (!submission) {
      return Response.json({ status: "not_found" });
    }
    return Response.json({
      status: submission.status,
      narrativeStatus: submission.narrativeStatus ?? "skipped",
      submissionId: submission.id,
      topRecommendation: submission.report?.topRecommendation ?? null
    });
  } catch (error) {
    return jsonError(error);
  }
}
