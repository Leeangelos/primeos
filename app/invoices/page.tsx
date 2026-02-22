"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SEED_INVOICES, type SeedInvoice, type SeedInvoiceLineItem } from "@/src/lib/seed-data";

export default function InvoicesPage() {
  const [selected, setSelected] = useState<SeedInvoice | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Demo: always show seed invoices (no empty state)
  const invoices = SEED_INVOICES;

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Invoice Scanner</h1>
          <EducationInfoIcon metricKey="invoice_scanning" />
        </div>
        <p className="text-xs text-muted">
          Snap a photo of any vendor invoice. AI extracts every line item and price.
        </p>

        {/* Prominent Scan button with camera icon */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className={cn(
            "w-full min-h-[52px] rounded-xl border-2 border-brand/50 bg-brand/15 px-4 py-3",
            "flex items-center justify-center gap-2 text-brand font-semibold text-base",
            "hover:bg-brand/25 active:scale-[0.98] transition-transform disabled:opacity-50"
          )}
        >
          <span className="text-xl leading-none" aria-hidden>
            📷
          </span>
          {scanning ? "Scanning…" : "Scan Invoice"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setScanning(true);
            e.target.value = "";
            if (file) setTimeout(() => setScanning(false), 1500);
          }}
        />
      </div>

      {/* Recent invoices list */}
      <div className="px-3 sm:px-5 space-y-2">
        <h2 className="text-sm font-medium text-slate-400 px-1">Recent invoices</h2>
        {invoices.map((inv) => (
          <button
            key={inv.id}
            type="button"
            onClick={() => setSelected(inv)}
            className="w-full text-left rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0 active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{inv.vendor_name}</p>
                <p className="text-slate-400 text-sm mt-0.5">
                  {formatDate(inv.invoice_date)}
                  {inv.invoice_number && (
                    <span className="ml-2">#{inv.invoice_number}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-white font-bold tabular-nums">
                  ${inv.total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
                    inv.status === "Processed"
                      ? "text-emerald-400 bg-emerald-500/20"
                      : "text-amber-400 bg-amber-500/20"
                  )}
                >
                  {inv.status}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Invoice detail — parsed line items */}
      {selected && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-0 sm:p-4"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-detail-title"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
            <div
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-start justify-between gap-2">
                <div>
                  <h2 id="invoice-detail-title" className="text-lg font-bold text-white">
                    {selected.vendor_name}
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {formatDate(selected.invoice_date)}
                    {selected.invoice_number && ` · #${selected.invoice_number}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Line items</span>
                  <span className="text-white font-semibold tabular-nums">
                    Total ${selected.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <ul className="space-y-2">
                  {selected.line_items.map((item: SeedInvoiceLineItem, idx: number) => (
                    <li
                      key={idx}
                      className="flex justify-between items-baseline gap-2 py-2 border-b border-slate-700/50 last:border-0 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="text-slate-200">{item.product}</span>
                        <span className="text-slate-500 ml-2">
                          {item.qty} {item.unit} × ${item.unit_price.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-white font-medium tabular-nums shrink-0">
                        ${item.extended_price.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Total</span>
                  <span className="text-lg font-bold text-white tabular-nums">
                    ${selected.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
