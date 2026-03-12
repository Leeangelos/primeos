"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSeasonalCharacter } from "@/components/ask-primeos/SeasonalConfig";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function AskPrimeOS() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [pagePath, setPagePath] = useState<string>("/");
  const [keyboardOffset, setKeyboardOffset] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const seasonal = useMemo(() => getSeasonalCharacter(new Date()), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    let slug =
      params.get("store") ??
      params.get("store_id") ??
      params.get("store_slug") ??
      null;

    if (!slug) {
      try {
        const lsStore =
          window.localStorage.getItem("selectedStore") ??
          window.localStorage.getItem("store_slug");
        if (lsStore && lsStore.trim()) {
          slug = lsStore.trim();
        }
      } catch {
        // ignore localStorage errors
      }
    }

    if (slug) {
      setStoreSlug(slug);
    }
    setPagePath(window.location.pathname || "/");

    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () => {
      const offset = Math.max(0, window.innerHeight - viewport.height);
      setKeyboardOffset(offset);
    };
    viewport.addEventListener("resize", handleResize);
    return () => {
      viewport.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ask-primeos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          store_slug: storeSlug,
          page_path: pagePath,
        }),
      });
      const data = await res.json();
      const replyText =
        typeof data.reply === "string" && data.reply.trim().length > 0
          ? data.reply.trim()
          : "I had trouble generating a response. Try asking again in a moment.";
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: replyText,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: "I couldn't reach PrimeOS right now. Please try again shortly.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-24 sm:bottom-28 z-40 flex items-center gap-2 rounded-full bg-slate-900/90 border border-slate-700 px-3.5 py-2 shadow-lg shadow-black/40 hover:bg-slate-800 transition-colors min-h-[44px]"
        style={{ marginBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        aria-label={seasonal.label}
      >
        <span className="text-lg" aria-hidden="true">
          {seasonal.emoji}
        </span>
        <span className="text-xs font-semibold text-slate-100 whitespace-nowrap">
          {seasonal.label}
        </span>
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-0 z-50 flex flex-col justify-end pointer-events-none">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 pointer-events-auto"
            aria-label="Close Ask PrimeOS"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative bg-[#050816] border-t border-slate-800 rounded-t-2xl shadow-2xl w-full mx-auto flex flex-col pointer-events-auto"
            style={{
              height: "50vh",
              maxHeight: "50vh",
              paddingBottom: keyboardOffset ? keyboardOffset : 0,
            }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">
                  {seasonal.emoji}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">Ask PrimeOS</p>
                  <p className="text-[10px] text-slate-400">
                    Fast ops advice for this store.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg px-2"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-slate-500">
                  Ask anything about today&apos;s numbers, staffing, menu, or
                  systems. PrimeOS will answer for{" "}
                  <span className="font-semibold">{storeSlug}</span> and this
                  page.
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "ml-auto bg-blue-600 text-white"
                      : "mr-auto bg-slate-800 text-slate-100 border border-slate-700"
                  }`}
                >
                  {m.content}
                </div>
              ))}
            </div>

            <div className="px-4 pb-3 pt-2 border-t border-slate-800 bg-[#050816]">
              <div className="flex items-end gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask PrimeOS..."
                  autoComplete="off"
                  enterKeyHint="send"
                  className="flex-1 rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  onClick={() => {
                    inputRef.current?.focus();
                  }}
                  onFocus={() => {
                    if (typeof window !== "undefined" && !window.visualViewport) {
                      setKeyboardOffset(300);
                    }
                  }}
                  onBlur={() => {
                    if (typeof window !== "undefined" && !window.visualViewport) {
                      setKeyboardOffset(0);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="min-h-[40px] rounded-full px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-slate-500 text-right">
                Powered by Claude
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

