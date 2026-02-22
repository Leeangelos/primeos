import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { BottomNav } from "@/src/components/layout/BottomNav";

import type { Viewport, Metadata } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://primeos.app";

export const metadata: Metadata = {
  title: "PrimeOS — The Operating System for Pizza",
  description: "One app. Every number. Plain English. 90 seconds a day.",
  manifest: "/manifest.json",
  openGraph: {
    title: "PrimeOS — The Operating System for Pizza",
    description: "One app. Every number. Plain English. 90 seconds a day.",
    type: "website",
    url: siteUrl,
    siteName: "PrimeOS",
  },
  twitter: {
    card: "summary",
    title: "PrimeOS — The Operating System for Pizza",
    description: "One app. Every number. Plain English. 90 seconds a day.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent" as const,
    title: "PrimeOS",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-brand/15 ring-1 ring-brand/25 grid place-items-center">
                <span className="text-brand font-semibold">P</span>
              </div>
              <div>
                <div className="text-lg font-semibold leading-tight">PrimeOS</div>
                <div className="text-sm text-muted">PRIME-first KPI system</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <AppNav />
              <span className="text-sm text-muted hidden sm:inline">Internal • Manual Entry</span>
            </div>
          </header>

          <main className="glass glow rounded-2xl p-3 sm:p-5 pb-24">{children}</main>

          <footer className="text-xs text-slate-500 text-center py-4 pb-24">
            © 2026 Ambition & Legacy LLC. All rights reserved.
          </footer>

          <BottomNav />
        </div>
      </body>
    </html>
  );
}
