import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function roundScore(value: number) {
  return Math.round(clamp(value));
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function intersect<T>(left: readonly T[], right: readonly T[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

export function unique<T>(items: readonly T[]) {
  return Array.from(new Set(items));
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
