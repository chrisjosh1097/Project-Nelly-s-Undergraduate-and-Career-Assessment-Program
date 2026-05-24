import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Header } from "@/components/auth/Header";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Nelly - Tes Jurusan & Karier",
  description: "Rekomendasi jurusan dan karier berbasis heuristic scoring untuk siswa SMA/SMK Indonesia."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <Header />
          <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8 sm:px-6 lg:py-12">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
