import Link from "next/link";

export default function WeeklyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Weekly Rollups</h1>
        <p className="mt-1 text-sm text-muted">
          Mon–Sun with 4AM cutoff, trends + charts.
        </p>
      </div>
      <div className="rounded-2xl bg-panel/40 ring-1 ring-border/30 p-5 text-sm text-muted">
        Weekly rollup view is not built yet. You’ll land here when it’s ready.
      </div>
      <Link
        href="/"
        className="inline-block text-sm text-brand hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  );
}
