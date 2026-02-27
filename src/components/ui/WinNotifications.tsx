"use client";

import { getWinsForStore } from "@/src/lib/win-notifications";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";

type Props = {
  storeId: string;
};

export function WinNotifications({ storeId }: Props) {
  const wins = getWinsForStore(storeId);

  if (!wins.length) return null;

  return (
    <section className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">Wins Today</span>
        <EducationInfoIcon metricKey="win_notifications" size="sm" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {wins.map((win) => (
          <div
            key={win.id}
            className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl px-4 py-3 flex items-start gap-2 min-w-[240px] max-w-xs"
          >
            <div className="text-xl leading-none" aria-hidden="true">
              {win.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-emerald-400 truncate">{win.title}</div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                {win.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

