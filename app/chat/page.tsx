"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { EDUCATION_CONTENT } from "@/src/lib/education-content";
import { SEED_CHAT_MESSAGES } from "@/src/lib/seed-data";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";

function getMessageColor(senderName: string) {
  switch (senderName.toLowerCase()) {
    case "angelo": return "bg-blue-600/20 border-blue-700/30";
    case "greg": return "bg-emerald-600/20 border-emerald-700/30";
    case "rosario": return "bg-amber-600/20 border-amber-700/30";
    case "leeann": return "bg-purple-600/20 border-purple-700/30";
    default: return "bg-slate-700/50 border-slate-600";
  }
}

function getAvatarColor(senderName: string) {
  switch (senderName.toLowerCase()) {
    case "angelo": return "bg-blue-600";
    case "greg": return "bg-emerald-600";
    case "rosario": return "bg-amber-600";
    case "leeann": return "bg-purple-600";
    default: return "bg-slate-600";
  }
}

function getTextColor(senderName: string) {
  switch (senderName.toLowerCase()) {
    case "angelo": return "text-blue-400";
    case "greg": return "text-emerald-400";
    case "rosario": return "text-amber-400";
    case "leeann": return "text-purple-400";
    default: return "text-slate-400";
  }
}

const CHANNELS = [
  { key: "general" as const, label: "General" },
  { key: "announcements" as const, label: "Announcements" },
  { key: "shift-swap" as const, label: "Shift Swap" },
  { key: "managers-only" as const, label: "Managers Only" },
];

const ROLE_STYLE: Record<string, string> = {
  owner: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  manager: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  shift_lead: "bg-brand/20 text-brand border-brand/40",
  cook: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  cashier: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  driver: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  team: "bg-muted/20 text-muted border-border/40",
};

type Message = {
  id: string;
  store_id: string | null;
  channel: string;
  sender_name: string;
  sender_role: string | null;
  message: string;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
};

export default function ChatPage() {
  const [store, setStore] = useState<CockpitStoreSlug>("kent");
  const [channel, setChannel] = useState<typeof CHANNELS[number]["key"]>("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ general: 0, announcements: 0, "shift-swap": 0, "managers-only": 0 });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [playbookOpen, setPlaybookOpen] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const userMap: Record<string, { name: string; color: string }> = {
          "leeangelos.corp@gmail.com": { name: "Angelo", color: "blue" },
          "greg@leeangelos.com": { name: "Greg", color: "green" },
          "rosario@leeangelos.com": { name: "Rosario", color: "amber" },
          "leeann@leeangelos.com": { name: "LeeAnn", color: "purple" },
        };
        const mapped = userMap[user.email || ""] || { name: user.email?.split("@")[0] || "User", color: "slate" };
        setCurrentUser({ email: user.email || "", name: mapped.name });
      }
    });
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/chat?store=${store}&channel=${channel}&limit=50`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.messages) && data.messages.length > 0) {
      setMessages(data.messages);
    } else {
      setMessages(SEED_CHAT_MESSAGES.filter((m) => m.channel === channel));
    }
    setLoading(false);
  }, [store, channel]);

  const loadCounts = useCallback(async () => {
    const res = await fetch(`/api/chat/counts?store=${store}`);
    const data = await res.json();
    if (data.ok) setCounts(data.counts ?? {});
  }, [store]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  async function handleSend() {
    if (!newMessage.trim() || !currentUser) return;
    setSending(true);
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_slug: store,
        channel,
        sender_name: currentUser.name,
        sender_role: null,
        message: newMessage.trim(),
        is_pinned: false,
        is_announcement: false,
      }),
    });
    setSending(false);
    setNewMessage("");
    loadMessages();
    loadCounts();
  }

  const pinned = messages.filter((m) => m.is_pinned);
  const rest = messages.filter((m) => !m.is_pinned);
  const isAnnouncements = channel === "announcements";

  return (
    <div className="space-y-5 pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl">Team Chat</h1>
          <EducationInfoIcon metricKey="team_communication" />
        </div>
        <p className="text-xs text-muted">In-app communication by store and channel. No personal numbers, searchable, organized.</p>

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

        <div className="flex flex-wrap gap-1.5 justify-center">
          {CHANNELS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setChannel(c.key)}
              className={cn("min-h-[44px] rounded-lg border px-2.5 py-1.5 text-xs font-medium", channel === c.key ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted hover:text-white")}
            >
              {c.label} {counts[c.key] != null ? `(${counts[c.key]})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-surface rounded-lg border border-border flex flex-col" style={{ minHeight: "360px" }}>
        {loading ? (
          <div className="flex-1 p-4 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted/20" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-muted/20 rounded mb-1" />
                  <div className="h-3 w-full bg-muted/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pinned.length > 0 && (
                <div className="space-y-2 mb-4 pb-3 border-b border-border/50">
                  <div className="text-[10px] uppercase text-muted font-medium flex items-center gap-1">📌 Pinned</div>
                  {pinned.map((m) => (
                    <MessageBlock key={m.id} m={m} isAnnouncements={isAnnouncements} />
                  ))}
                </div>
              )}
              {rest.map((m) => (
                <MessageBlock key={m.id} m={m} isAnnouncements={isAnnouncements} />
              ))}
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted text-sm">No messages in this channel yet.</div>
              )}
            </div>

            <div className="p-3 border-t border-border/50 space-y-2">
              {!currentUser ? (
                <p className="text-sm text-muted py-2">Log in to use chat.</p>
              ) : null}
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={currentUser ? "Type a message..." : "Log in to use chat"}
                  rows={2}
                  disabled={!currentUser}
                  className="flex-1 rounded-lg border border-border/50 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-muted focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending || !currentUser}
                  className="min-h-[44px] rounded-lg border border-brand/50 bg-brand/15 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/25 disabled:opacity-50 shrink-0"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Layer 3 playbook card — visible, collapsible */}
      {(() => {
        const entry = EDUCATION_CONTENT.team_communication;
        if (!entry) return null;
        return (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setPlaybookOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left bg-red-500/10 border-b border-red-500/20"
            >
              <h3 className="text-sm font-semibold text-red-400/95">When Communication Breaks Down — Operator Playbook</h3>
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

      {false && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => {}}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => {}} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 In-App Communication</h3>
            <p className="text-xs text-muted mb-4">Why team chat beats group texts.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">Accountability & Search</h4>
                <p className="text-muted text-xs leading-relaxed">Everything is in one place with your name and timestamp. Need to find who said they’d cover Friday? Search it. No more scrolling through personal group chats or “I thought someone else was doing it.”</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">No Personal Numbers</h4>
                <p className="text-muted text-xs leading-relaxed">Managers and staff don’t have to share personal phones. Shift swaps and announcements stay on the clock and on the record. New hires get access without exchanging numbers.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Organized by Topic</h4>
                <p className="text-muted text-xs leading-relaxed">General chat, announcements, shift-swap requests, and managers-only keep conversations focused. Pinned and announcement messages stand out so important info isn’t buried.</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function MessageBlock({ m, isAnnouncements }: { m: Message; isAnnouncements: boolean }) {
  const roleStyle = ROLE_STYLE[m.sender_role ?? ""] ?? ROLE_STYLE.team;
  const messageColor = isAnnouncements || m.is_announcement ? "border-amber-500/40 bg-amber-500/5" : getMessageColor(m.sender_name);
  const avatarColor = getAvatarColor(m.sender_name);
  const textColor = getTextColor(m.sender_name);
  const time = new Date(m.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className={cn("rounded-lg border p-3", messageColor)}>
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", avatarColor)}>
          {m.sender_name.slice(0, 1)}
        </span>
        <span className={cn("font-medium text-sm", textColor)}>{m.sender_name}</span>
        {m.sender_role && (
          <span className={cn("text-[10px] uppercase px-2 py-0.5 rounded border", roleStyle)}>{m.sender_role.replace("_", " ")}</span>
        )}
        <span className="text-[10px] text-muted">{time}</span>
        {m.is_pinned && <span className="text-[10px] text-amber-400">📌</span>}
      </div>
      <p className={cn("text-sm text-muted leading-relaxed whitespace-pre-wrap", (isAnnouncements || m.is_announcement) && "text-amber-100/90")}>{m.message}</p>
    </div>
  );
}
