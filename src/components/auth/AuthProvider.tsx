"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getFirebaseClientAuth,
  getUserIdToken,
  isFirebaseClientConfigured,
  signInWithGoogle,
  signOutGoogle
} from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseClientConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(getFirebaseClientAuth(), (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      signIn: async () => {
        await signInWithGoogle();
      },
      signOut: signOutGoogle,
      getToken: async () => {
        if (!user) throw new Error("Login diperlukan.");
        return getUserIdToken(user);
      }
    }),
    [configured, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
