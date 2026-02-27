import Link from "next/link";

export function Phase2Placeholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-brand/15 ring-1 ring-brand/25 grid place-items-center mb-6">
        <span className="text-brand font-semibold text-xl">P</span>
      </div>
      <h1 className="text-xl font-semibold text-white mb-2">Available in Phase 2</h1>
      <p className="text-sm text-muted mb-6 max-w-sm">
        This feature is available in Phase 2.
      </p>
      <Link
        href="/"
        className="rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-medium text-brand hover:bg-brand/25 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}

