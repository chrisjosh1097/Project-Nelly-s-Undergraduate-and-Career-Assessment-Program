import { AuthError } from "@/lib/firebase/admin";

export function jsonError(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ error: "Terjadi kesalahan." }, { status: 500 });
}

export function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
