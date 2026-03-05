"use client";

import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SmartQuestion } from "@/src/components/ui/SmartQuestion";

export default function MarketingPage() {
  const { session, loading } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);

  if (loading) return <div className="min-h-screen bg-zinc-950" />;
  if (newUser) {
    return (
      <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
        <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-2xl">Ad Accountability</h1>
            <EducationInfoIcon metricKey="marketing_roas" size="lg" />
          </div>
          <p className="text-xs text-muted">{newUserStoreName}</p>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 shadow-sm p-6 space-y-3">
          <p className="text-sm text-zinc-300">Ad Accountability tracks ROAS by campaign so you can see which spend drives sales. Once your data is connected, you&apos;ll see daily, weekly, and monthly breakdowns here.</p>
          <p className="text-sm text-zinc-300">Ready for live data? Reach out to us and we&apos;ll get your system connected.</p>
          <a href="mailto:hello@getprimeos.com" className="text-[#E65100] underline font-semibold inline-block">hello@getprimeos.com</a>
        </div>
        <SmartQuestion page="marketing" />
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Ad Accountability</h1>
          <EducationInfoIcon metricKey="marketing_roas" size="lg" />
        </div>
        <p className="text-xs text-muted">
          Marketing analytics — Available in Phase 2. No data source yet.
        </p>
      </div>
      <SmartQuestion page="marketing" />
      <div className="px-3 sm:px-5 py-10 rounded-xl border border-zinc-800/50 bg-zinc-900/50 text-center">
        <p className="text-zinc-400 text-sm">Marketing analytics — Available in Phase 2</p>
      </div>
    </div>
  );
}
