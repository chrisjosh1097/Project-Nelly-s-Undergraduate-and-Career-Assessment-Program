import { Suspense } from "react";
import { LoginPanel } from "@/components/auth/LoginPanel";

export default function LoginPage() {
  return (
    <div className="grid min-h-[calc(100vh-10rem)] place-items-center">
      <Suspense fallback={<div className="text-sm text-ink/70">Memuat login...</div>}>
        <LoginPanel />
      </Suspense>
    </div>
  );
}
