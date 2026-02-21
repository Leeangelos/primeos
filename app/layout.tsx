import "./globals.css";
import { AppNav } from "@/components/app-nav";

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: "PrimeOS",
  description: "The 90-Day Pizza Profit System",
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
              <span className="text-sm text-muted hidden sm:inline">Internal • Manual Entry • v0</span>
            </div>
          </header>

          <main className="glass glow rounded-2xl p-5">{children}</main>

          <footer className="mt-6 text-xs text-muted">
            <span>Business cutoff: 4:00 AM ET</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
