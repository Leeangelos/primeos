"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type LineItem = {
  product: string;
  qty: number;
  unit: string;
  unit_price: number;
  extended_price: number;
};

type Extraction = {
  vendor_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  total: number | null;
  line_items: LineItem[];
};

type Invoice = {
  id: string;
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total: number | null;
  line_items: LineItem[];
  status: string;
  created_at: string;
  approved_at: string | null;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Extraction | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [editingItems, setEditingItems] = useState<LineItem[]>([]);
  const [editVendor, setEditVendor] = useState("");
  const [editInvoiceNum, setEditInvoiceNum] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [filter, setFilter] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/invoices?status=${filter}`);
    const data = await res.json();
    if (data.ok) setInvoices(data.invoices);
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  async function handleScan(file: File) {
    setScanning(true);
    setScanError(null);
    setScanResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/invoices/scan", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.ok) {
        setScanResult(data.extraction);
        setEditingItems(data.extraction.line_items || []);
        setEditVendor(data.extraction.vendor_name || "");
        setEditInvoiceNum(data.extraction.invoice_number || "");
        setEditDate(data.extraction.invoice_date || "");
        setEditTotal(String(data.extraction.total || ""));
      } else {
        setScanError(data.error || "Scan failed");
      }
    } catch {
      setScanError("Network error");
    }

    setScanning(false);
  }

  function updateLineItem(idx: number, field: keyof LineItem, value: string | number) {
    const updated = [...editingItems];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "qty" || field === "unit_price") {
      updated[idx].extended_price = +(Number(updated[idx].qty) * Number(updated[idx].unit_price)).toFixed(2);
    }
    setEditingItems(updated);
  }

  function removeLineItem(idx: number) {
    setEditingItems(editingItems.filter((_, i) => i !== idx));
  }

  async function handleApprove() {
    setSaving(true);

    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_name: editVendor,
        invoice_number: editInvoiceNum,
        invoice_date: editDate || null,
        total: Number(editTotal) || null,
        line_items: editingItems,
        status: "approved",
        raw_extraction: scanResult,
      }),
    });

    setSaving(false);
    setScanResult(null);
    setEditingItems([]);
    loadInvoices();
  }

  const inputCls = "w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-muted/50 focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none";

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-2xl">Invoice Scanner</h1>
            <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="min-h-[44px] rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/25 disabled:opacity-50"
          >
            {scanning ? "Scanning…" : "📷 Scan Invoice"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleScan(file);
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-xs text-muted">Snap a photo of any vendor invoice. AI extracts every line item and price.</p>
        <div className="flex gap-2">
          {["all", "approved", "pending"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors capitalize",
                filter === s
                  ? "border-brand/50 bg-brand/15 text-brand"
                  : "border-border/30 bg-black/20 text-muted hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Scanning indicator */}
      {scanning && (
        <div className="dashboard-surface rounded-lg border border-brand/30 p-6 text-center">
          <div className="h-8 w-8 mx-auto mb-3 rounded-full bg-brand/20 animate-pulse" />
          <div className="text-sm text-brand font-medium">Reading invoice with AI...</div>
          <div className="text-xs text-muted mt-1">This takes 5-10 seconds</div>
        </div>
      )}

      {/* Scan error */}
      {scanError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{scanError}</p>
          <button type="button" onClick={() => { setScanError(null); fileRef.current?.click(); }} className="mt-2 text-xs text-brand hover:underline">Try again</button>
        </div>
      )}

      {/* Scan result review */}
      {scanResult && !scanning && (
        <div className="dashboard-surface rounded-lg border border-brand/30 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-brand">Review Extracted Data</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Vendor</label>
              <input type="text" value={editVendor} onChange={(e) => setEditVendor(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Invoice #</label>
              <input type="text" value={editInvoiceNum} onChange={(e) => setEditInvoiceNum(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Date</label>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Total</label>
              <input type="number" step="0.01" value={editTotal} onChange={(e) => setEditTotal(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted font-medium">{editingItems.length} Line Items</label>
              <div className="text-xs text-muted tabular-nums">
                Sum: ${editingItems.reduce((s, i) => s + (i.extended_price || 0), 0).toFixed(2)}
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-auto">
              {editingItems.map((item, idx) => (
                <div key={idx} className="flex flex-wrap gap-1.5 items-center text-xs min-w-0">
                  <input type="text" value={item.product} onChange={(e) => updateLineItem(idx, "product", e.target.value)} className={cn(inputCls, "flex-1 text-xs py-1.5 px-2")} />
                  <input type="number" value={item.qty} onChange={(e) => updateLineItem(idx, "qty", Number(e.target.value))} className={cn(inputCls, "w-14 text-xs py-1.5 px-2")} />
                  <input type="text" value={item.unit} onChange={(e) => updateLineItem(idx, "unit", e.target.value)} className={cn(inputCls, "w-12 text-xs py-1.5 px-2")} />
                  <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateLineItem(idx, "unit_price", Number(e.target.value))} className={cn(inputCls, "w-16 text-xs py-1.5 px-2")} />
                  <span className="text-muted tabular-nums w-14 text-right">${item.extended_price.toFixed(2)}</span>
                  <button type="button" onClick={() => removeLineItem(idx)} className="text-red-400 text-xs px-1">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleApprove}
              disabled={saving}
              className="flex-1 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
            >
              {saving ? "Saving…" : "✓ Approve & Save"}
            </button>
            <button
              type="button"
              onClick={() => { setScanResult(null); setEditingItems([]); }}
              className="rounded-lg border border-border/50 bg-black/30 px-4 py-3 text-sm text-muted hover:text-white"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Invoice history */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-4">
              <div className="h-4 w-40 bg-muted/20 rounded mb-2" />
              <div className="h-3 w-24 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      ) : invoices.length === 0 && !scanResult ? (
        <div className="text-center py-12 text-muted text-sm">
          No invoices yet. Tap "Scan Invoice" to photograph your first one.
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-lg border border-border/50 bg-black/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{inv.vendor_name || "Unknown Vendor"}</span>
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded",
                    inv.status === "approved" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                  )}>
                    {inv.status}
                  </span>
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {inv.total ? `$${inv.total.toFixed(2)}` : "—"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted">
                {inv.invoice_number && <span>#{inv.invoice_number}</span>}
                {inv.invoice_date && <span>{new Date(inv.invoice_date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                <span>{inv.line_items?.length || 0} items</span>
                <span>{new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Education Modal */}
      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 Invoice Scanner</h3>
            <p className="text-xs text-muted mb-4">Your invoices become data in 10 seconds.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">How It Works</h4>
                <p className="text-muted text-xs leading-relaxed">Take a photo of any vendor invoice. AI reads every line item — product names, quantities, unit prices, totals. You review and approve. Done. No manual data entry.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Why This Matters</h4>
                <p className="text-muted text-xs leading-relaxed">Most operators don't track individual product prices because it's too tedious. When your cheese goes up $0.40/lb, you don't notice until month-end when food cost is 3 points over. Invoice scanning catches price changes the day they happen.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">What Happens With The Data</h4>
                <p className="text-muted text-xs leading-relaxed">Approved invoices update your ingredient prices in Recipe Cards. Your theoretical food cost stays accurate automatically. Price spikes trigger alerts. You always know what you're paying — and whether it changed.</p>
              </div>
              <div className="rounded-lg border border-brand/30 bg-brand/5 p-3">
                <h4 className="font-medium text-brand text-xs mb-1">💡 This replaces $330/mo invoice scanning services</h4>
                <p className="text-muted text-xs leading-relaxed">Other restaurants pay $330/month per location for Margin Edge to do exactly this. PrimeOS includes it. That's $3,960/year back in your pocket — per location.</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
