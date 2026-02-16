import "./globals.css";
import { DbStatus } from "@/components/db-status";

export const metadata = {
  title: "PrimeOS",
  description: "Internal KPI Operating System",
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
          <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-brand/15 ring-1 ring-brand/25 grid place-items-center">
                <span className="text-brand font-semibold">P</span>
              </div>
              <div>
                <div className="text-lg font-semibold leading-tight">PrimeOS</div>
                <div className="text-sm text-muted">PRIME-first KPI system</div>
              </div>
            </div>

            <div className="text-sm text-muted">Internal • Manual Entry • v0</div>
          </header>

          <main className="glass glow rounded-2xl p-5">{children}</main>

          <footer className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>Business cutoff: 4:00 AM America/New_York</span>
            <span aria-hidden>·</span>
            <DbStatus />
          </footer>
        </div>
      </body>
    </html>
  );
}
