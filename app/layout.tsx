import "./globals.css";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { BottomNav } from "@/src/components/layout/BottomNav";
import { ConsentBanner } from "@/src/components/legal/ConsentBanner";
import { TOSGate } from "@/src/components/legal/TOSGate";
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

export const metadata: Metadata = {
  title: "PrimeOS — The Operating System for Pizza",
  description: "One app. Every number. Plain English. 90 seconds a day.",
  metadataBase: new URL("https://primeos-nine.vercel.app"),
  openGraph: {
    title: "PrimeOS — The Operating System for Pizza",
    description: "One app. Every number. Plain English. 90 seconds a day.",
    url: "https://primeos-nine.vercel.app",
    siteName: "PrimeOS",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "PrimeOS — The Operating System for Pizza",
    description: "One app. Every number. Plain English. 90 seconds a day.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
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
          <TOSGate>
            <div className="mx-auto max-w-6xl px-4 py-4">
              <AppNav />

              <main className="glass glow rounded-2xl p-3 sm:p-5 pb-28 mt-4">{children}</main>

              <footer className="text-center py-4 pb-28">
                <p className="text-xs text-slate-500">© 2026 Ambition & Legacy LLC. All rights reserved.</p>
                <div className="flex justify-center gap-3 mt-1">
                  <Link href="/terms" className="text-xs text-slate-600 hover:text-slate-400">Terms of Service</Link>
                  <span className="text-xs text-slate-700">·</span>
                  <Link href="/privacy" className="text-xs text-slate-600 hover:text-slate-400">Privacy Policy</Link>
                </div>
              </footer>

              <ConsentBanner />
              <BottomNav />
            </div>
          </TOSGate>
        </TierProvider>
      </body>
    </html>
  );
}
