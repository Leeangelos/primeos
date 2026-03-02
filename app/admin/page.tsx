"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useAuth } from "@/src/lib/auth-context";
import { ChevronDown, ChevronUp, Loader2, ArrowLeft, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const CORRECT_PIN = "5959";

type Onboarding = {
  weekly_sales?: number | null;
  food_cost_pct?: number | null;
  labor_cost_pct?: number | null;
  employee_count?: number | null;
  monthly_rent?: number | null;
  goals?: string[] | null;
  google_business_name?: string | null;
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  county?: string | null;
  phone?: string | null;
  website_url?: string | null;
  completed_at?: string | null;
};

type Signup = {
  id: string;
  email: string;
  name: string;
  store_name: string;
  phone: string;
  city: string;
  state: string;
  pos: string;
  pos_system: string;
  invite_code: string;
  signed_up: string;
  onboarding: Onboarding | null;
};

type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string;
  business_type: string;
  city_state: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

function PinScreen({
  onCorrect,
  onShake,
}: {
  onCorrect: () => void;
  onShake: () => void;
}) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);

  const submit = useCallback(() => {
    if (pin === CORRECT_PIN) {
      setError(false);
      onCorrect();
    } else {
      setError(true);
      setShake(true);
      onShake();
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [pin, onCorrect, onShake]);

  useEffect(() => {
    if (pin.length === 4) submit();
  }, [pin, submit]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative">
      <button type="button" onClick={() => window.history.back()} className="absolute top-0 left-0 p-2 text-zinc-400 hover:text-white" aria-label="Back">
        <ArrowLeft className="w-6 h-6" />
      </button>
      <h1 className="text-xl font-semibold text-white mb-8">Admin Access</h1>
      <div className={cn("transition-all", shake && "animate-shake")}>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
            setPin(v);
            setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={cn(
            "w-32 text-center text-3xl tracking-[0.5em] rounded-xl border-2 bg-slate-800 text-white outline-none",
            error ? "border-red-500" : "border-slate-600 focus:border-orange-500"
          )}
          placeholder="••••"
          autoFocus
        />
      </div>
      {error && <p className="mt-3 text-red-500 text-sm">Incorrect PIN</p>}
      <button
        type="button"
        onClick={submit}
        className="mt-6 px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium"
      >
        Enter
      </button>
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const { session } = useAuth();
  const [pinOk, setPinOk] = useState(false);
  const [adminTab, setAdminTab] = useState<"signups" | "waitlist">("signups");
  const [signups, setSignups] = useState<Signup[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchErrorWaitlist, setFetchErrorWaitlist] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedWaitlistId, setExpandedWaitlistId] = useState<string | null>(null);

  useEffect(() => {
    if (!pinOk || !session?.access_token) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    fetch("/api/admin", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Access denied" : "Failed to load");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setSignups(data.signups ?? []);
      })
      .catch((e) => {
        if (!cancelled) setFetchError(e.message ?? "Error loading signups");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pinOk, session?.access_token]);

  useEffect(() => {
    if (!pinOk || !session?.access_token || adminTab !== "waitlist") return;
    let cancelled = false;
    setLoadingWaitlist(true);
    setFetchErrorWaitlist(null);
    fetch("/api/admin/waitlist", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Access denied" : "Failed to load");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setWaitlist(data.waitlist ?? []);
      })
      .catch((e) => {
        if (!cancelled) setFetchErrorWaitlist(e.message ?? "Error loading waitlist");
      })
      .finally(() => {
        if (!cancelled) setLoadingWaitlist(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pinOk, session?.access_token, adminTab]);

  if (!pinOk) {
    return (
      <PinScreen
        onCorrect={() => setPinOk(true)}
        onShake={() => {}}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <button type="button" onClick={() => window.history.back()} className="p-2 text-zinc-400 hover:text-white" aria-label="Back">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button type="button" onClick={() => setPinOk(false)} className="p-2 text-zinc-400 hover:text-white ml-auto" aria-label="Lock">
            <Lock className="w-6 h-6" />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white">PrimeOS Admin</h1>
        <div className="mt-3 flex gap-2 border-b border-slate-700">
          <button
            type="button"
            onClick={() => setAdminTab("signups")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors",
              adminTab === "signups"
                ? "text-orange-400 border-orange-500 bg-slate-800/80"
                : "text-slate-400 border-transparent hover:text-white"
            )}
          >
            Signups ({signups.length})
          </button>
          <button
            type="button"
            onClick={() => setAdminTab("waitlist")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors",
              adminTab === "waitlist"
                ? "text-orange-400 border-orange-500 bg-slate-800/80"
                : "text-slate-400 border-transparent hover:text-white"
            )}
          >
            Waitlist ({waitlist.length})
          </button>
        </div>

        {adminTab === "signups" && loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}
        {adminTab === "signups" && fetchError && (
          <p className="mt-4 text-red-400">{fetchError}</p>
        )}
        {adminTab === "signups" && !loading && !fetchError && signups.length === 0 && (
          <p className="mt-6 text-slate-500">No signups yet.</p>
        )}
        {adminTab === "signups" && !loading && !fetchError && signups.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block mt-8 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-300">Name</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Store</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Phone</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Email</th>
                    <th className="px-4 py-3 font-medium text-slate-300">City/State</th>
                    <th className="px-4 py-3 font-medium text-slate-300">POS</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Invite Code</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Signed Up</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {signups.map((s) => {
                    const open = expandedId === s.id;
                    return (
                      <Fragment key={s.id}>
                        <tr
                          key={s.id}
                          onClick={() => setExpandedId(open ? null : s.id)}
                          className="bg-slate-800/50 hover:bg-slate-800 cursor-pointer"
                        >
                          <td className="px-4 py-3">{s.name || "—"}</td>
                          <td className="px-4 py-3">{s.store_name || "—"}</td>
                          <td className="px-4 py-3">{s.phone || "—"}</td>
                          <td className="px-4 py-3">{s.email || "—"}</td>
                          <td className="px-4 py-3">{s.city && s.state ? `${s.city}, ${s.state}` : s.city || s.state || "—"}</td>
                          <td className="px-4 py-3">{s.pos_system || s.pos || "—"}</td>
                          <td className="px-4 py-3">{s.invite_code || "—"}</td>
                          <td className="px-4 py-3 text-slate-400">{formatDate(s.signed_up)}</td>
                          <td className="px-2 py-3">{open ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}</td>
                        </tr>
                        {open && (
                          <tr key={`${s.id}-exp`} className="bg-slate-900/80">
                            <td colSpan={9} className="px-4 py-4">
                              <DetailsBlock signup={s} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden mt-6 space-y-3">
              {signups.map((s) => {
                const open = expandedId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setExpandedId(open ? null : s.id)}
                    className={cn(
                      "rounded-xl border overflow-hidden",
                      open ? "border-orange-500/50 bg-slate-800/80" : "border-slate-700 bg-slate-800/50"
                    )}
                  >
                    <div className="p-4 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-white">{s.name || "—"}</div>
                        <div className="text-slate-400 text-sm mt-0.5">{s.store_name || "—"}</div>
                        <div className="text-slate-500 text-xs mt-1">POS: {s.pos_system || s.pos || "—"}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{formatDate(s.signed_up)}</div>
                      </div>
                      {open ? <ChevronUp className="w-5 h-5 text-orange-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />}
                    </div>
                    {open && (
                      <div className="px-4 pb-4">
                        <DetailsBlock signup={s} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {adminTab === "waitlist" && loadingWaitlist && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}
        {adminTab === "waitlist" && fetchErrorWaitlist && (
          <p className="mt-4 text-red-400">{fetchErrorWaitlist}</p>
        )}
        {adminTab === "waitlist" && !loadingWaitlist && !fetchErrorWaitlist && waitlist.length === 0 && (
          <p className="mt-6 text-slate-500">No waitlist entries yet.</p>
        )}
        {adminTab === "waitlist" && !loadingWaitlist && !fetchErrorWaitlist && waitlist.length > 0 && (
          <>
            <div className="hidden md:block mt-8 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-300">Name</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Business</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Type</th>
                    <th className="px-4 py-3 font-medium text-slate-300">City/State</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Date</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Status</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {waitlist.map((w) => {
                    const open = expandedWaitlistId === w.id;
                    return (
                      <Fragment key={w.id}>
                        <tr
                          onClick={() => setExpandedWaitlistId(open ? null : w.id)}
                          className="bg-slate-800/50 hover:bg-slate-800 cursor-pointer"
                        >
                          <td className="px-4 py-3">{w.name || "—"}</td>
                          <td className="px-4 py-3">{w.business_name || "—"}</td>
                          <td className="px-4 py-3">
                            {w.business_type === "pizza" ? (
                              <span className="inline-flex items-center gap-1">
                                <span>🍕</span>
                                <span className="capitalize">{w.business_type}</span>
                              </span>
                            ) : (
                              <span className="capitalize">{w.business_type}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">{w.city_state || "—"}</td>
                          <td className="px-4 py-3 text-slate-400">{formatDate(w.created_at)}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={w.status} />
                          </td>
                          <td className="px-2 py-3">{open ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}</td>
                        </tr>
                        {open && (
                          <tr key={`${w.id}-exp`} className="bg-slate-900/80">
                            <td colSpan={7} className="px-4 py-4">
                              <WaitlistDetailsBlock entry={w} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden mt-6 space-y-3">
              {waitlist.map((w) => {
                const open = expandedWaitlistId === w.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => setExpandedWaitlistId(open ? null : w.id)}
                    className={cn(
                      "rounded-xl border overflow-hidden",
                      open ? "border-orange-500/50 bg-slate-800/80" : "border-slate-700 bg-slate-800/50"
                    )}
                  >
                    <div className="p-4 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-white">{w.name || "—"}</div>
                        <div className="text-slate-400 text-sm mt-0.5">{w.business_name || "—"}</div>
                        <div className="text-slate-500 text-xs mt-1">
                          {w.business_type === "pizza" ? "🍕 Pizza" : w.business_type} · {formatDate(w.created_at)}
                        </div>
                        <div className="mt-2">
                          <StatusBadge status={w.status} />
                        </div>
                      </div>
                      {open ? <ChevronUp className="w-5 h-5 text-orange-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />}
                    </div>
                    {open && (
                      <div className="px-4 pb-4">
                        <WaitlistDetailsBlock entry={w} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    contacted: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    converted: "bg-green-500/20 text-green-400 border-green-500/40",
    passed: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40",
  };
  const s = status in styles ? status : "new";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", styles[s] || styles.new)}>
      {s}
    </span>
  );
}

function WaitlistDetailsBlock({ entry }: { entry: WaitlistEntry }) {
  const isPizza = entry.business_type === "pizza";
  return (
    <div className="text-sm space-y-3 text-slate-300">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-slate-500">Email</span>
        <span>{entry.email || "—"}</span>
        <span className="text-slate-500">Phone</span>
        <span>{entry.phone || "—"}</span>
        <span className="text-slate-500">Message</span>
        <span className="col-span-2">{entry.message || "—"}</span>
      </div>
      <p className={cn("text-xs pt-2 border-t border-slate-700", isPizza ? "text-orange-400" : "text-slate-500")}>
        {isPizza ? "Pizza operator — fast track" : "Non-pizza — Hillcrest lead"}
      </p>
    </div>
  );
}

function DetailsBlock({ signup }: { signup: Signup }) {
  const o = signup.onboarding;
  return (
    <div className="text-sm space-y-3 text-slate-300">
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-slate-500">Phone</span>
        <span>{signup.phone || o?.phone || "—"}</span>
        <span className="text-slate-500">Email</span>
        <span>{signup.email || "—"}</span>
        <span className="text-slate-500">City/State</span>
        <span>{[signup.city, signup.state].filter(Boolean).join(", ") || (o?.city && o?.state ? `${o.city}, ${o.state}` : "—")}</span>
        <span className="text-slate-500">POS</span>
        <span>{signup.pos_system || signup.pos || "—"}</span>
        <span className="text-slate-500">Invite Code</span>
        <span>{signup.invite_code || "—"}</span>
      </div>
      {o && (
        <>
          <div className="border-t border-slate-700 pt-3 mt-3">
            <div className="text-orange-400 font-medium mb-2">Onboarding</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-slate-500">Weekly sales</span>
              <span>{o.weekly_sales != null ? `$${Number(o.weekly_sales).toLocaleString()}` : "—"}</span>
              <span className="text-slate-500">Food cost %</span>
              <span>{o.food_cost_pct != null ? `${o.food_cost_pct}%` : "—"}</span>
              <span className="text-slate-500">Labor %</span>
              <span>{o.labor_cost_pct != null ? `${o.labor_cost_pct}%` : "—"}</span>
              <span className="text-slate-500">Employees</span>
              <span>{o.employee_count ?? "—"}</span>
              <span className="text-slate-500">Monthly rent</span>
              <span>{o.monthly_rent != null ? `$${Number(o.monthly_rent).toLocaleString()}` : "—"}</span>
              <span className="text-slate-500">Goals</span>
              <span>{Array.isArray(o.goals) ? o.goals.join(", ") : "—"}</span>
              <span className="text-slate-500">Onboarding completed</span>
              <span>{formatDate(o.completed_at ?? "")}</span>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-3">
            <div className="text-orange-400 font-medium mb-2">Google Business</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-slate-500">Name</span>
              <span>{o.google_business_name || "—"}</span>
              <span className="text-slate-500">Address</span>
              <span>{[o.street_address, o.city, o.state, o.zip_code].filter(Boolean).join(", ") || "—"}</span>
              <span className="text-slate-500">County</span>
              <span>{o.county || "—"}</span>
              <span className="text-slate-500">Website</span>
              <span>{o.website_url ? <a href={o.website_url} target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">{o.website_url}</a> : "—"}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
