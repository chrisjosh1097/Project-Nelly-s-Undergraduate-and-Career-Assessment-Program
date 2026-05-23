import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export class AuthError extends Error {
  status = 401;
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getPrivateKey() {
  return requiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
}

export function getFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  return initializeApp({
    credential: cert({
      projectId: requiredEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requiredEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: getPrivateKey()
    })
  });
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export async function verifyFirebaseRequest(request: Request): Promise<DecodedIdToken> {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AuthError("Login Google diperlukan.");
  }

  const decoded = await getAdminAuth().verifyIdToken(token);
  if (!decoded.email || decoded.email_verified !== true) {
    throw new AuthError("Email Google harus terverifikasi.");
  }

  return decoded;
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function verifyAdminRequest(request: Request) {
  const decoded = await verifyFirebaseRequest(request);
  const email = decoded.email?.toLowerCase();
  if (!email || !getAdminEmails().includes(email)) {
    const error = new AuthError("Akses admin tidak tersedia untuk email ini.");
    error.status = 403;
    throw error;
  }
  return decoded;
}
