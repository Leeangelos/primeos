"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser } from "@/src/lib/user-scope";
import {
  SMART_QUESTIONS,
  getQuestionsForPage,
  type SmartQuestion as SmartQuestionType,
} from "@/src/lib/smart-questions";
import { cn } from "@/lib/utils";

const SKIP_KEY_PREFIX = "primeos-smart-q-skip-";

function getSkippedIds(): string[] {
  if (typeof window === "undefined") return [];
  const out: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(SKIP_KEY_PREFIX) && window.localStorage.getItem(key) === "1") {
      out.push(key.slice(SKIP_KEY_PREFIX.length));
    }
  }
  return out;
}

function markSkipped(id: string) {
  try {
    window.localStorage.setItem(`${SKIP_KEY_PREFIX}${id}`, "1");
  } catch {}
}

export function SmartQuestion({ page }: { page: string }) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<SmartQuestionType | null>(null);
  const [value, setValue] = useState<string | number | string[]>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [skippedIds, setSkippedIds] = useState<string[]>(() => getSkippedIds());

  const isNew = isNewUser(session);

  useEffect(() => {
    if (!session?.access_token || !isNew) return;
    let cancelled = false;
    fetch("/api/operator-profile", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setProfile(data.profile ?? {});
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.access_token, isNew]);

  const pickCurrent = useCallback(() => {
    const list = getQuestionsForPage(page);
    const answered = new Set(
      SMART_QUESTIONS.filter((q) => {
        const v = profile[q.field];
        return v !== undefined && v !== null && v !== "";
      }).map((q) => q.id)
    );
    const next = list.find((q) => !answered.has(q.id) && !skippedIds.includes(q.id));
    setCurrent(next ?? null);
    if (next) {
      const existing = profile[next.field];
      if (next.type === "multi_select" && Array.isArray(existing)) setValue(existing);
      else if (existing !== undefined && existing !== null && existing !== "") setValue(String(existing));
      else setValue(next.type === "multi_select" ? [] : "");
    }
  }, [page, profile, skippedIds]);

  useEffect(() => {
    if (loading) return;
    pickCurrent();
  }, [loading, pickCurrent]);

  const handleSave = async () => {
    if (!current || !session?.access_token) return;
    setSaving(true);
    try {
      const payload: { field: string; value: unknown } = {
        field: current.field,
        value: current.type === "number" ? (typeof value === "string" ? parseFloat(value) || 0 : value) : value,
      };
      const res = await fetch("/api/operator-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          pickCurrent();
        }, 1200);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (!current) return;
    markSkipped(current.id);
    const nextSkipped = [...skippedIds, current.id];
    setSkippedIds(nextSkipped);
    const list = getQuestionsForPage(page);
    const answered = new Set(
      SMART_QUESTIONS.filter((q) => {
        const v = profile[q.field];
        return v !== undefined && v !== null && v !== "" && (Array.isArray(v) ? v.length > 0 : true);
      }).map((q) => q.id)
    );
    const next = list.find((q) => !answered.has(q.id) && !nextSkipped.includes(q.id));
    setCurrent(next ?? null);
    if (next) {
      const existing = profile[next.field];
      setValue(next.type === "multi_select" ? (Array.isArray(existing) ? existing : []) : (existing != null ? String(existing) : ""));
    }
  };

  if (!isNew || loading) return null;
  if (!current) return null;

  const toggleMulti = (opt: string) => {
    const arr = Array.isArray(value) ? [...value] : [];
    const i = arr.indexOf(opt);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(opt);
    setValue(arr);
  };

  return (
    <div className="bg-zinc-900/50 border border-dashed border-[#E65100]/40 rounded-2xl p-4 mb-4">
      {saved ? (
        <p className="text-sm font-semibold text-emerald-400">✓ Saved</p>
      ) : (
        <>
          <p className="text-sm font-semibold text-white mb-3">
            <span className="mr-1.5">💡</span>
            {current.question}
          </p>
          {current.type === "number" && (
            <input
              type="number"
              placeholder={current.placeholder}
              value={value === "" ? "" : String(value)}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E65100]/50 mb-3"
            />
          )}
          {current.type === "text" && (
            <input
              type="text"
              placeholder={current.placeholder}
              value={String(value)}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E65100]/50 mb-3"
            />
          )}
          {current.type === "select" && (
            <select
              value={String(value)}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E65100]/50 mb-3"
            >
              <option value="">Select...</option>
              {(current.options ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}
          {current.type === "multi_select" && (
            <div className="flex flex-wrap gap-2 mb-3">
              {(current.options ?? []).map((o) => {
                const selected = Array.isArray(value) && value.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggleMulti(o)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      selected ? "bg-[#E65100]/20 border-[#E65100]/60 text-white" : "bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-zinc-500"
                    )}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || (current.type === "multi_select" ? !Array.isArray(value) || value.length === 0 : false)}
              className="bg-[#E65100] text-white text-xs px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={handleSkip} className="text-xs text-zinc-500 underline">
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  );
}
