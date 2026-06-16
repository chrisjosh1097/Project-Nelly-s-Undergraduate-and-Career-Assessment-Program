"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export function isFirebaseClientConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

export function getFirebaseClientApp(): FirebaseApp {
  if (!isFirebaseClientConfigured()) {
    throw new Error("Firebase client config belum lengkap.");
  }
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseClientAuth(): Auth {
  const auth = getAuth(getFirebaseClientApp());
  auth.useDeviceLanguage();
  return auth;
}

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function shouldFallbackToRedirect(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("auth/popup-blocked") ||
    message.includes("auth/cancelled-popup-request") ||
    message.includes("auth/operation-not-supported-in-this-environment")
  );
}

export async function signInWithGoogle() {
  const auth = getFirebaseClientAuth();
  const provider = createGoogleProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    if (!shouldFallbackToRedirect(error)) throw error;
    await signInWithRedirect(auth, provider);
    return null;
  }
}

export async function completeRedirectSignIn() {
  const result = await getRedirectResult(getFirebaseClientAuth());
  return result?.user ?? null;
}

export async function signOutGoogle() {
  return signOut(getFirebaseClientAuth());
}

export async function getUserIdToken(user: User) {
  return user.getIdToken();
}
