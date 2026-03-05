"use client";

import { useState } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SmartQuestion } from "@/src/components/ui/SmartQuestion";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { cn } from "@/lib/utils";

type StoreSlug = CockpitStoreSlug | "all";
const STORE_OPTIONS: { slug: StoreSlug; name: string }[] = [
  ...COCKPIT_STORE_SLUGS.map((slug) => ({ slug, name: COCKPIT_TARGETS[slug]?.name ?? slug })),
  { slug: "all", name: "All Locations" },
];
function getStoreLabel(slug: StoreSlug): string {
  if (slug === "all") return "All Locations";
  return COCKPIT_TARGETS[slug as CockpitStoreSlug]?.name ?? slug;
}

export default function SchedulePage() {
  const { session } = useAuth();
  const newUser = isNewUser(session);
  const [storeOpen, setStoreOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreSlug>("kent");
  const selectedStoreName = newUser ? getNewUserStoreName(session) : getStoreLabel(selectedStore);

  return (
    <div className="space-y-5 pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl">Schedule</h1>
          <EducationInfoIcon metricKey="labor_optimization" size="lg" />
        </div>
        <p className="text-xs text-muted">Week view. Schedule data syncs from your POS daily.</p>
      </div>

      <div className="relative mb-4 px-3 sm:px-5">
        {newUser ? (
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-[#E65100]/50 text-sm text-white min-h-[44px] w-full sm:w-auto">
            <MapPin className="w-4 h-4 text-[#E65100] shrink-0" aria-hidden />
            <span className="truncate font-medium">{selectedStoreName}</span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStoreOpen((o) => !o)}
              className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700 text-sm text-white min-h-[44px] w-full sm:w-auto"
              aria-haspopup="listbox"
              aria-expanded={storeOpen}
              aria-label={`Store: ${selectedStoreName}. Select location.`}
            >
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" aria-hidden />
              <span className="truncate">{selectedStoreName}</span>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", storeOpen && "rotate-180")} aria-hidden />
            </button>
            {storeOpen && (
              <>
                <div className="fixed inset-0 z-30" aria-hidden="true" onClick={() => setStoreOpen(false)} />
                <div className="absolute top-full left-3 right-3 sm:left-0 sm:right-auto mt-1 z-40 w-64 bg-slate-800 rounded-xl border border-slate-700 shadow-lg shadow-black/30 overflow-hidden">
                  {STORE_OPTIONS.map((opt) => (
                    <button
                      key={opt.slug}
                      type="button"
                      onClick={() => {
                        setSelectedStore(opt.slug);
                        setStoreOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-700/50 transition-colors",
                        selectedStore === opt.slug ? "text-blue-400" : "text-slate-300"
                      )}
                    >
                      <span>{opt.name}</span>
                      {selectedStore === opt.slug && <Check className="w-4 h-4 text-blue-400 shrink-0" aria-hidden />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <SmartQuestion page="schedule" />

      <div className="px-3 sm:px-5 py-8 rounded-xl border border-slate-700 bg-slate-800/50 text-center">
        <p className="text-slate-300">Schedule data syncs from your POS daily. Individual shift records will appear here once wired.</p>
      </div>
    </div>
  );
}
