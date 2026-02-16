import Link from "next/link";

export default function TargetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Targets</h1>
        <p className="mt-1 text-sm text-muted">
          Effective date ranges, store-level target history.
        </p>
      </div>
      <div className="rounded-2xl bg-panel/40 ring-1 ring-border/30 p-5 text-sm text-muted">
        Target management is not built yet. You’ll land here when it’s ready.
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
