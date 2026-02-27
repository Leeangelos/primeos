"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { EDUCATION_CONTENT } from "@/src/lib/education-content";

type Size = "sm" | "md";

type EducationInfoIconProps = {
  metricKey: string;
  size?: Size;
};

const sizeClasses: Record<Size, string> = {
  sm: "text-base leading-none w-4 h-4 min-w-[16px] min-h-[16px]",
  md: "text-lg leading-none w-5 h-5 min-w-[20px] min-h-[20px]",
};

export function EducationInfoIcon({ metricKey, size = "sm" }: EducationInfoIconProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const entry = EDUCATION_CONTENT[metricKey];

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(t);
    }
    setMounted(false);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  if (!entry) return null;

  const modal = open && typeof document !== "undefined" && createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="education-sheet-title"
    >
      {/* Backdrop — tap to close */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      {/* Bottom sheet — slides up on mobile */}
      <div
        className="relative w-full max-w-lg bg-slate-800 rounded-t-2xl max-h-[80vh] overflow-y-auto shadow-2xl transition-transform duration-300 ease-out sm:rounded-2xl sm:max-h-[85vh]"
        style={{ transform: mounted ? "translateY(0)" : "translateY(100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={close}
          className="absolute top-3 right-3 z-10 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Close"
        >
          <span className="text-lg leading-none">×</span>
        </button>

        <div className="p-5 pt-6 pb-8">
          <h2 id="education-sheet-title" className="text-lg font-bold text-white pr-8">
            {entry.title}
          </h2>

          <section className="mt-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              What This Means
            </h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              {entry.whatItMeans}
            </p>
          </section>

          {entry.whyItMatters && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Why It Matters
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {entry.whyItMatters}
              </p>
            </section>
          )}

          <section className="mt-6">
            <h3 className="text-sm font-semibold text-amber-400/90 uppercase tracking-wide">
              Playbook
            </h3>
            <ul className="mt-2 space-y-2">
              {entry.whenRedPlaybook.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-400 leading-relaxed">
                  <span className="text-slate-500 shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="education-info-icon"
        className={`
          inline-flex items-center justify-center rounded-full
          text-slate-500 hover:text-blue-400 cursor-pointer
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-900
          ${sizeClasses[size]}
        `}
        aria-label={`Learn more about ${entry.title}`}
      >
        <span className="sr-only">Learn more</span>
        <span aria-hidden>ⓘ</span>
      </button>
      {modal}
    </>
  );
}
