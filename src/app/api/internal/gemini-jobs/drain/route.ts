import { jsonError } from "@/lib/api";
import { drainGeminiNarrativeJobs, isGeminiWorkerAuthorized } from "@/lib/recommendation/geminiQueue";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isGeminiWorkerAuthorized(request)) {
      return Response.json({ error: "Unauthorized worker request." }, { status: 401 });
    }

    const result = await drainGeminiNarrativeJobs();
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
