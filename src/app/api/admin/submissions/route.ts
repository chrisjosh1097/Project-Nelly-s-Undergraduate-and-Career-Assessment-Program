import {jsonError} from "@/lib/api";
import {verifyManualAdminRequest} from "@/lib/admin/session";
import {listSubmissions} from "@/lib/submissions/store";
import {parseSubmissionFilters} from "@/lib/submissions/filters";
export const runtime="nodejs";
export async function GET(request:Request){
 try{verifyManualAdminRequest(request);const submissions=await listSubmissions(parseSubmissionFilters(new URL(request.url).searchParams));return Response.json({submissions})}catch(error){return jsonError(error)}
}
