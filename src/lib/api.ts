import { AuthError } from "@/lib/firebase/admin";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function jsonError(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ error: "Terjadi kesalahan." }, { status: 500 });
}

export async function readJsonBody(request: Request, maxBytes = 24_000) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes) {
    throw new ApiError("Payload terlalu besar. Kurangi panjang jawaban.", 413);
  }

  const text = await request.text();
  const byteLength = new TextEncoder().encode(text).length;
  if (byteLength > maxBytes) {
    throw new ApiError("Payload terlalu besar. Kurangi panjang jawaban.", 413);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError("Format JSON tidak valid.", 400);
  }
}

export function csvEscape(value: unknown) {
  const text = String(value ?? "");
  const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}
