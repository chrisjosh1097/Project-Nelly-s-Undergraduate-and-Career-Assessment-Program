import { createHmac, timingSafeEqual } from "crypto";
import { AuthError } from "@/lib/firebase/admin";

export const ADMIN_SESSION_COOKIE = "project_nelly_admin";

function requiredAdminEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function adminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || requiredAdminEnv("ADMIN_LOGIN_PASSWORD");
}

function signPayload(payload: string) {
  return createHmac("sha256", adminSessionSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function verifyAdminCredentials(email: string, password: string) {
  const expectedEmail = requiredAdminEnv("ADMIN_LOGIN_EMAIL").trim().toLowerCase();
  const expectedPassword = requiredAdminEnv("ADMIN_LOGIN_PASSWORD");
  return email.trim().toLowerCase() === expectedEmail && password === expectedPassword;
}

export function createAdminSessionToken(email: string) {
  const payload = Buffer.from(
    JSON.stringify({
      email: email.trim().toLowerCase(),
      exp: Date.now() + 1000 * 60 * 60 * 8
    })
  ).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function verifyAdminSessionToken(token?: string) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export function adminSessionSetCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure}`;
}

export function adminSessionClearCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function verifyManualAdminRequest(request: Request) {
  const token = readCookie(request, ADMIN_SESSION_COOKIE);
  if (!verifyAdminSessionToken(token)) {
    const error = new AuthError("Login admin diperlukan.");
    error.status = 401;
    throw error;
  }
}
