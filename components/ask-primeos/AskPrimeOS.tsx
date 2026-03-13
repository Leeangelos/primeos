"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getSeasonalCharacter } from "@/components/ask-primeos/SeasonalConfig";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function stripMarkdown(text: string): string {
  let result = text;
  // Bold **text**
  result = result.replace(/\*\*(.+?)\*\*/g, "$1");
  // Italic *text*
  result = result.replace(/\*(.+?)\*/g, "$1");
  // Headings #, ##, etc. at line start
  result = result.replace(/^#{1,6}\s*/gm, "");
  // Bullet points at line start: "- " → "• "
  result = result.replace(/^\s*-\s+/gm, "• ");
  return result;
}

export function AskPrimeOS() {
  const pathname = usePathname();
  const [storeName, setStoreName] = useState<string>("your store");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetHeight, setSheetHeight] = useState<number>(55);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragStartHeight, setDragStartHeight] = useState<number>(55);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setPopoverOpen(true);
    const onClose = () => setPopoverOpen(false);
    window.addEventListener("primeos:popover-open", onOpen);
    window.addEventListener("primeos:popover-close", onClose);
    return () => {
      window.removeEventListener("primeos:popover-open", onOpen);
      window.removeEventListener("primeos:popover-close", onClose);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const lastStore = window.localStorage.getItem("primeos-last-store");
      if (lastStore && lastStore.trim()) {
        setStoreName(lastStore.trim());
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "init",
          role: "assistant",
          content: `Hi! Ask me anything about ${storeName}.`,
        },
      ]);
    }
  }, [storeName, messages.length]);

  const seasonal = useMemo(() => getSeasonalCharacter(new Date()), []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ask-primeos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          store_slug: storeName,
          page_path: pathname || "/",
        }),
      });
      const data = await res.json();
      console.log("ask-primeos response:", data);
      const text =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : "I had trouble generating a response. Try again in a moment.";
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: stripMarkdown(text),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: "I couldn't reach PrimeOS right now. Please try again shortly.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setSending(false);
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
    setDragStartHeight(sheetHeight);
  };

  const handleDragMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartY == null) return;
    const touch = e.touches[0];
    const deltaY = dragStartY - touch.clientY; // drag up => positive
    if (typeof window === "undefined") return;
    const vhDelta = (deltaY / window.innerHeight) * 100;
    const next = Math.min(85, Math.max(55, dragStartHeight + vhDelta));
    setSheetHeight(next);
  };

  const handleDragEnd = () => {
    setDragStartY(null);
  };

  return (
    <>
      {/* Floating button — hidden when a page popover (e.g. shift editor) is open */}
      {!popoverOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-32 right-6 z-60 flex items-center gap-2 rounded-full bg-slate-900/90 border border-slate-700 px-3.5 py-2 shadow-lg shadow-black/40 hover:bg-slate-800 transition-colors min-h-[44px]"
          aria-label={seasonal.label}
        >
          <span className="text-lg" aria-hidden="true">
            {seasonal.emoji}
          </span>
          <span className="text-xs font-semibold text-slate-100 whitespace-nowrap">
            {seasonal.label}
          </span>
        </button>
      )}

      {/* Bottom sheet + backdrop */}
      <>
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setIsOpen(false)}
          />
        )}
        <div
          className={`fixed bottom-0 left-0 right-0 z-60 bg-gray-900 rounded-t-2xl border-t border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
          style={{ height: `${sheetHeight}vh` }}
        >
          {/* Drag handle */}
          <div
            className="w-12 h-1 bg-gray-600 rounded-full mx-auto mt-3 mb-2"
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">
                {seasonal.emoji}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Ask PrimeOS
                </p>
                <p className="text-[10px] text-slate-400">
                  Fast ops advice for {storeName}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-lg px-2"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="h-[35vh] overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-orange-500 text-black"
                    : "mr-auto bg-transparent text-slate-100 border border-slate-600"
                }`}
              >
                {m.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span aria-hidden="true">{seasonal.emoji}</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Input row */}
          <div className="flex-shrink-0 px-4 pb-6 pt-2">
            <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                autoComplete="off"
                enterKeyHint="send"
                className="flex-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="min-h-[36px] rounded-full px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Send…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </>
    </>
  );
}

