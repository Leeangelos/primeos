"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { EDUCATION_CONTENT } from "@/src/lib/education-content";
import { SEED_TASKS, SEED_EMPLOYEES } from "@/src/lib/seed-data";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";

function todayYYYYMMDD(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const CATEGORIES = [
  { key: "all" as const, label: "All" },
  { key: "opening" as const, label: "Opening" },
  { key: "closing" as const, label: "Closing" },
  { key: "prep" as const, label: "Prep" },
  { key: "cleaning" as const, label: "Cleaning" },
  { key: "custom" as const, label: "Custom" },
];

const ROLES: Record<string, string> = {
  manager: "Manager",
  shift_lead: "Shift Lead",
  cook: "Cook",
  cashier: "Cashier",
  driver: "Driver",
  team: "Team",
};

const PRIORITY_STYLE: Record<string, string> = {
  low: "text-muted border-border/30",
  medium: "text-amber-400 border-amber-500/30",
  high: "text-red-400 border-red-500/30",
};

type Task = {
  id: string;
  store_id: string | null;
  title: string;
  category: string;
  assigned_role: string;
  due_date: string;
  due_time: string | null;
  is_recurring: boolean;
  recurrence: string | null;
  status: string;
  completed_by: string | null;
  completed_at: string | null;
  created_by: string | null;
  priority: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export default function TasksPage() {
  const { session, loading: authLoading } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const [store, setStore] = useState<CockpitStoreSlug>("kent");
  const [date, setDate] = useState(todayYYYYMMDD);
  const [category, setCategory] = useState<typeof CATEGORIES[number]["key"]>("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addCategory, setAddCategory] = useState<Task["category"]>("custom");
  const [addRole, setAddRole] = useState<Task["assigned_role"]>("team");
  const [addDueTime, setAddDueTime] = useState("");
  const [addPriority, setAddPriority] = useState<Task["priority"]>("medium");
  const [addNotes, setAddNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [playbookOpen, setPlaybookOpen] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completingSelectedName, setCompletingSelectedName] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ store, date });
    if (category !== "all") params.set("category", category);
    const res = await fetch(`/api/tasks?${params}`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.tasks) && data.tasks.length > 0) {
      setTasks(data.tasks);
    } else {
      const byStore = SEED_TASKS.filter((t) => t.store_id === store);
      setTasks(category === "all" ? byStore : byStore.filter((t) => t.category === category));
    }
    setLoading(false);
  }, [store, date, category]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasksList = tasks.filter((t) => t.status === "completed");

  const employees = SEED_EMPLOYEES.filter((e) => e.status === "active");

  async function handleComplete(taskId: string, selectedName: string) {
    if (!selectedName?.trim()) return;
    setSaving(true);
    const completedAt = new Date().toLocaleString();
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: taskId,
        status: "completed",
        completed_by: selectedName.trim(),
        completed_at: new Date().toISOString(),
      }),
    });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: "completed", completed_by: selectedName.trim(), completed_at: completedAt }
          : t
      )
    );
    setSaving(false);
    setCompletingTaskId(null);
    setCompletingSelectedName("");
  }

  async function handleAddTask() {
    if (!addTitle.trim()) return;
    setSaving(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_slug: store,
        title: addTitle.trim(),
        category: addCategory,
        assigned_role: addRole,
        due_date: date,
        due_time: addDueTime.trim() || null,
        priority: addPriority,
        notes: addNotes.trim() || null,
        status: "pending",
      }),
    });
    setSaving(false);
    setShowAddTask(false);
    setAddTitle("");
    setAddCategory("custom");
    setAddRole("team");
    setAddDueTime("");
    setAddPriority("medium");
    setAddNotes("");
    loadTasks();
  }

  const sc = getStoreColor(store);

  if (authLoading) return <div className="min-h-screen bg-zinc-950" />;
  if (newUser) {
    return (
      <div className="space-y-5 pb-28">
        <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold sm:text-2xl">Manager Tasks</h1>
            <EducationInfoIcon metricKey="task_management" />
          </div>
          <p className="text-xs text-muted">{newUserStoreName}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
          <p className="text-sm text-zinc-300 mb-4">Your task list is ready. Start adding tasks to keep your team on track.</p>
          <button type="button" onClick={() => setShowAddTask(true)} className="px-4 py-2.5 rounded-xl bg-[#E65100] text-white font-semibold text-sm hover:bg-[#f3731a] transition-colors">Add Task</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl">Manager Tasks</h1>
          <EducationInfoIcon metricKey="task_management" />
        </div>
        <p className="text-xs text-muted">Daily opening, closing, prep, and cleaning. Mark complete when done.</p>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {COCKPIT_STORE_SLUGS.map((slug) => {
            const s = getStoreColor(slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setStore(slug)}
                className={cn("min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === slug ? `${s.borderActive} ${s.bgActive} ${s.text}` : "border-border/30 bg-black/20 text-muted hover:text-white")}
              >
                {COCKPIT_TARGETS[slug].name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button type="button" onClick={() => setDate(prevDay(date))} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/50 bg-black/30 text-muted hover:text-white transition-colors" aria-label="Previous day">←</button>
          <span className="text-sm font-medium min-w-[140px] text-center min-h-[44px] flex items-center justify-center">{formatDate(date)}</span>
          {date !== todayYYYYMMDD() && (
            <button
              type="button"
              onClick={() => setDate(todayYYYYMMDD())}
              className="min-h-[44px] px-3 py-2 rounded-lg border border-[#E65100]/50 bg-[#E65100]/10 text-[#E65100] text-sm font-medium hover:bg-[#E65100]/20 transition-colors"
              aria-label="Jump to today"
            >
              Today
            </button>
          )}
          <button type="button" onClick={() => setDate(nextDay(date))} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/50 bg-black/30 text-muted hover:text-white transition-colors" aria-label="Next day">→</button>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={cn("min-h-[44px] rounded-lg border px-2.5 py-1.5 text-xs font-medium", category === c.key ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted hover:text-white")}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Completion rate header */}
      {!loading && totalTasks > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{completionRate}%</span>
            <span className="text-xs text-slate-500">{completedTasks}/{totalTasks} tasks</span>
            <EducationInfoIcon metricKey="completion_rate" size="sm" />
          </div>
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-bold",
            completionRate === 100 ? "bg-emerald-600/20 text-emerald-400" :
            completionRate >= 75 ? "bg-amber-600/20 text-amber-400" :
            "bg-red-600/20 text-red-400"
          )}>
            {completionRate === 100 ? "ALL DONE" : completionRate >= 75 ? "ALMOST" : "BEHIND"}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={() => setShowAddTask(true)} className="min-h-[44px] rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/25">+ Add Task</button>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-4"><div className="h-5 w-3/4 bg-muted/20 rounded" /><div className="h-4 w-1/2 bg-muted/20 rounded mt-2" /></div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">No tasks for this store and date.</div>
      ) : (
        <div className="space-y-2">
          {activeTasks.map((task) => {
            const isCompleted = task.status === "completed";
            return (
              <div
                key={task.id}
                className={cn("rounded-lg border p-3 flex items-center gap-3", isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 bg-black/20")}
              >
                {completingTaskId === task.id ? (
                  <div className="mt-2 p-3 rounded-xl bg-slate-700/50 border border-slate-600 relative z-20 min-w-0 flex-1 sm:flex-initial flex flex-col gap-3 pb-28">
                    <div className="mb-1">
                      <select
                        value={completingSelectedName}
                        onChange={(e) => setCompletingSelectedName(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg text-xs text-white h-10 px-2 min-h-[44px]"
                        autoFocus
                      >
                        <option value="">Who completed this?</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.name}>{emp.name} ({ROLES[emp.role] ?? emp.role})</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => completingSelectedName.trim() && handleComplete(task.id, completingSelectedName)}
                      disabled={!completingSelectedName.trim()}
                      className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-medium disabled:opacity-50 min-h-[44px]"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCompletingTaskId(null); setCompletingSelectedName(""); }}
                      className="w-full py-2.5 rounded-lg bg-slate-600 text-slate-300 text-xs font-medium min-h-[44px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompleted) return;
                      setCompletingTaskId(task.id);
                      setCompletingSelectedName("");
                    }}
                    className={cn("shrink-0 min-h-[44px] min-w-[44px] rounded border flex items-center justify-center text-sm", isCompleted ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400" : "border-border/50 bg-black/30 text-muted hover:border-brand/50")}
                    aria-label={isCompleted ? "Completed" : "Mark complete"}
                  >
                    {isCompleted ? "✓" : ""}
                  </button>
                )}
                {completingTaskId !== task.id && (
                  <div className="min-w-0 flex-1">
                    <div className={cn("font-medium text-sm", isCompleted && "line-through text-muted")}>{task.title}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-border/30 text-muted">{ROLES[task.assigned_role] ?? task.assigned_role}</span>
                      <span className="text-[10px] text-muted">{formatDate(task.due_date)}</span>
                      <span className={cn("text-[10px] uppercase px-2 py-0.5 rounded border", PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.medium)}>{task.priority}</span>
                      {task.due_time && <span className="text-[10px] text-muted">{task.due_time}</span>}
                      {isCompleted && task.completed_by && (
                        <span className="text-xs text-slate-500">
                          Completed by {task.completed_by}{task.completed_at ? ` · ${task.completed_at}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {completedTasksList.length > 0 && (
            <div className="mt-6">
              <button type="button" onClick={() => setShowCompleted(!showCompleted)} className="flex items-center gap-2 mb-3">
                <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", showCompleted ? "rotate-180" : "")} />
                <span className="text-sm text-slate-500 font-medium">Completed ({completedTasksList.length})</span>
              </button>
              {showCompleted && (
                <div className="space-y-2 opacity-60">
                  {completedTasksList.map((task) => (
                    <div key={task.id} className="bg-slate-800 rounded-xl border border-slate-700 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-600/30 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-sm text-slate-400 line-through">{task.title}</span>
                          {task.completed_by && (
                            <span className="text-xs text-slate-600 block">Completed by {task.completed_by}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Layer 3 playbook card — visible, collapsible */}
      {(() => {
        const entry = EDUCATION_CONTENT.task_management;
        if (!entry) return null;
        return (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setPlaybookOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left bg-red-500/10 border-b border-red-500/20"
            >
              <h3 className="text-sm font-semibold text-red-400/95">When Tasks Are Slipping — Operator Playbook</h3>
              <span className="text-red-400/80 shrink-0" aria-hidden>{playbookOpen ? "▼" : "▶"}</span>
            </button>
            {playbookOpen && (
              <ul className="p-4 space-y-2 text-sm text-muted leading-relaxed">
                {entry.whenRedPlaybook.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-red-400/70 shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })()}

      {/* Add task modal */}
      {showAddTask && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowAddTask(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowAddTask(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-white mb-4">Add Task</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Title</label>
                <input type="text" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} placeholder="e.g. Order napkins" className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-brand/60 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Category</label>
                <select value={addCategory} onChange={(e) => setAddCategory(e.target.value as Task["category"])} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none">
                  {CATEGORIES.filter((c) => c.key !== "all").map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Assigned role</label>
                <select value={addRole} onChange={(e) => setAddRole(e.target.value as Task["assigned_role"])} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none">
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Due time (optional)</label>
                <input type="text" value={addDueTime} onChange={(e) => setAddDueTime(e.target.value)} placeholder="e.g. 14:00" className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-brand/60 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Priority</label>
                <select value={addPriority} onChange={(e) => setAddPriority(e.target.value as Task["priority"])} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Notes (optional)</label>
                <textarea value={addNotes} onChange={(e) => setAddNotes(e.target.value)} rows={2} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-brand/60 focus:outline-none resize-none" placeholder="Notes" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleAddTask} disabled={!addTitle.trim() || saving} className="flex-1 rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/25 disabled:opacity-50">Add</button>
              <button type="button" onClick={() => setShowAddTask(false)} className="flex-1 rounded-lg border border-border/50 bg-black/30 px-4 py-2.5 text-sm text-muted hover:text-white">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {false && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => {}}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => {}} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 Task Accountability</h3>
            <p className="text-xs text-muted mb-4">Why task tracking reduces operational errors.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">Why Task Accountability Matters</h4>
                <p className="text-muted text-xs leading-relaxed">When opening and closing tasks are written down and checked off, nothing gets missed. Ovens get turned off. Walk-in temps get logged. Cash gets counted. One skipped step can cost you a health write-up or a safety incident. Manager Tasks gives you a single place to see what’s done and what’s left—and who did it.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">How Completion Tracking Reduces Errors</h4>
                <p className="text-muted text-xs leading-relaxed">Completion tracking with name and timestamp creates accountability. If something was missed, you can see who was responsible and when. Over time, completion rates by role and shift help you train and schedule better. Stores that track tasks consistently see fewer prep shortages, fewer closing oversights, and better audit readiness.</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
