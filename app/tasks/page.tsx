"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { EDUCATION_CONTENT } from "@/src/lib/education-content";
import { SEED_TASKS } from "@/src/lib/seed-data";
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
  const [store, setStore] = useState<CockpitStoreSlug>("kent");
  const [date, setDate] = useState(todayYYYYMMDD);
  const [category, setCategory] = useState<typeof CATEGORIES[number]["key"]>("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeTarget, setCompleteTarget] = useState<{ task: Task; name: string } | null>(null);
  const [completeName, setCompleteName] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addCategory, setAddCategory] = useState<Task["category"]>("custom");
  const [addRole, setAddRole] = useState<Task["assigned_role"]>("team");
  const [addDueTime, setAddDueTime] = useState("");
  const [addPriority, setAddPriority] = useState<Task["priority"]>("medium");
  const [addNotes, setAddNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [playbookOpen, setPlaybookOpen] = useState(true);

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

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const heroColor =
    completionPct >= 90 ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" :
    completionPct >= 70 ? "border-amber-500/50 bg-amber-500/10 text-amber-400" :
    "border-red-500/50 bg-red-500/10 text-red-400";

  async function handleComplete() {
    if (!completeTarget || !completeName.trim()) return;
    setSaving(true);
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: completeTarget.task.id,
        status: "completed",
        completed_by: completeName.trim(),
        completed_at: new Date().toISOString(),
      }),
    });
    setSaving(false);
    setCompleteTarget(null);
    setCompleteName("");
    loadTasks();
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

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl">Task Manager</h1>
          <EducationInfoIcon metricKey="task_management" />
        </div>
        <p className="text-xs text-muted">Daily opening, closing, prep, and cleaning. Check off when done.</p>

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

        <div className="flex items-center justify-center gap-2">
          <button type="button" onClick={() => setDate(prevDay(date))} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/50 bg-black/30 text-muted hover:text-white transition-colors" aria-label="Previous day">←</button>
          <span className="text-sm font-medium min-w-[140px] text-center min-h-[44px] flex items-center justify-center">{formatDate(date)}</span>
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

      {/* Progress bar + hero */}
      {!loading && totalCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{completedCount} of {totalCount} tasks complete</span>
            <span className="font-medium tabular-nums">{completionPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-black/40 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", completionPct >= 90 ? "bg-emerald-500" : completionPct >= 70 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${completionPct}%` }} />
          </div>
          <div className={cn("rounded-lg border p-4 text-center", heroColor)}>
            <div className="text-[10px] font-medium uppercase tracking-widest opacity-90">Completion rate</div>
            <div className="text-2xl font-bold mt-1">{completionPct}%</div>
            <div className="text-xs mt-1 opacity-90">
              {completionPct >= 90 ? "On track" : completionPct >= 70 ? "Catch up" : "Needs attention"}
            </div>
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
          {tasks.map((task) => {
            const isCompleted = task.status === "completed";
            return (
              <div
                key={task.id}
                className={cn("rounded-lg border p-3 flex items-center gap-3", isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 bg-black/20")}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted) return;
                    setCompleteTarget({ task, name: "" });
                    setCompleteName("");
                  }}
                  className={cn("shrink-0 min-h-[44px] min-w-[44px] rounded border flex items-center justify-center text-sm", isCompleted ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400" : "border-border/50 bg-black/30 text-muted hover:border-brand/50")}
                  aria-label={isCompleted ? "Completed" : "Mark complete"}
                >
                  {isCompleted ? "✓" : ""}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={cn("font-medium text-sm", isCompleted && "line-through text-muted")}>{task.title}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-border/30 text-muted">{ROLES[task.assigned_role] ?? task.assigned_role}</span>
                    <span className="text-[10px] text-muted">{formatDate(task.due_date)}</span>
                    <span className={cn("text-[10px] uppercase px-2 py-0.5 rounded border", PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.medium)}>{task.priority}</span>
                    {task.due_time && <span className="text-[10px] text-muted">{task.due_time}</span>}
                    {isCompleted && task.completed_by && <span className="text-[10px] text-emerald-400/80">by {task.completed_by}</span>}
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* Complete-task modal */}
      {completeTarget && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setCompleteTarget(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setCompleteTarget(null)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-white mb-1">Mark complete</h3>
            <p className="text-sm text-muted mb-3">{completeTarget.task.title}</p>
            <label className="block text-xs text-muted mb-1">Your name</label>
            <input
              type="text"
              value={completeName}
              onChange={(e) => setCompleteName(e.target.value)}
              placeholder="e.g. Jordan"
              className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none mb-4"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleComplete} disabled={!completeName.trim() || saving} className="flex-1 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50">Done</button>
              <button type="button" onClick={() => setCompleteTarget(null)} className="flex-1 rounded-lg border border-border/50 bg-black/30 px-4 py-2.5 text-sm text-muted hover:text-white">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
                <p className="text-muted text-xs leading-relaxed">When opening and closing tasks are written down and checked off, nothing gets missed. Ovens get turned off. Walk-in temps get logged. Cash gets counted. One skipped step can cost you a health write-up or a safety incident. Task Manager gives you a single place to see what’s done and what’s left—and who did it.</p>
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
