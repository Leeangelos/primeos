import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { BottomNav } from "@/src/components/layout/BottomNav";
import { TierProvider } from "@/src/lib/tier-context";

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
        <TierProvider>
        <div className="mx-auto max-w-6xl px-4 py-4">
          <AppNav />

          <main className="glass glow rounded-2xl p-3 sm:p-5 pb-28 mt-4">{children}</main>

          <footer className="text-xs text-slate-500 text-center py-4 pb-28">
            © 2026 Ambition & Legacy LLC. All rights reserved.
          </footer>

          <BottomNav />
        </div>
        </TierProvider>
      </body>
    </html>
  );
}
