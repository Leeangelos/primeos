"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Pencil, CheckCircle, AlertTriangle, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { ExportButton } from "@/src/components/ui/ExportButton";
import { SEED_INVOICES, type SeedInvoice, type SeedInvoiceLineItem } from "@/src/lib/seed-data";
import { VENDORS, type Vendor } from "@/src/lib/vendor-data";
import { formatDollars } from "@/src/lib/formatters";

function matchVendor(invoiceVendorName: string, storeId: string): Vendor | null {
  if (!invoiceVendorName || invoiceVendorName === "Unknown") return null;

  const storeVendors = VENDORS.filter((v) => v.store_id === storeId && v.is_active);
  const searchName = invoiceVendorName.toLowerCase().trim();

  const exact = storeVendors.find((v) => v.vendor_name.toLowerCase() === searchName);
  if (exact) return exact;

  const contains = storeVendors.find(
    (v) =>
      v.vendor_name.toLowerCase().includes(searchName) ||
      searchName.includes(v.vendor_name.toLowerCase().split(" ")[0].toLowerCase())
  );
  if (contains) return contains;

  const firstWord = storeVendors.find((v) => {
    const vendorFirst = v.vendor_name.toLowerCase().split(" ")[0];
    const invoiceFirst = searchName.split(" ")[0];
    return vendorFirst === invoiceFirst && vendorFirst.length > 3;
  });
  if (firstWord) return firstWord;

  return null;
}

function recalcLine(item: SeedInvoiceLineItem): SeedInvoiceLineItem {
  const ext = item.qty * item.unit_price;
  return { ...item, extended_price: Math.round(ext * 100) / 100 };
}

function recalcDraft(d: SeedInvoice): SeedInvoice {
  const items = d.line_items.map(recalcLine);
  const total = items.reduce((s, l) => s + l.extended_price, 0);
  return { ...d, line_items: items, total: Math.round(total * 100) / 100 };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<SeedInvoice[]>(SEED_INVOICES);
  const [approvedInvoices, setApprovedInvoices] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<SeedInvoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SeedInvoice | null>(null);
  const [scanning, setScanning] = useState(false);
  const [vendorPrompts, setVendorPrompts] = useState<Record<string, "pending" | "added" | "dismissed">>({});
  const [vendorAddToast, setVendorAddToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedStore = "kent";

  function handleAddToVendorTracker(invoice: SeedInvoice, vendor: Vendor) {
    setVendorPrompts((prev) => ({ ...prev, [invoice.id]: "added" }));
    setVendorAddToast(vendor.vendor_name);
    setTimeout(() => setVendorAddToast(null), 2500);
  }

  function handleNewVendorDetected(invoice: SeedInvoice) {
    setVendorPrompts((prev) => ({ ...prev, [invoice.id]: "dismissed" }));
    setVendorAddToast("New vendor — go to Vendor Settings to add " + invoice.vendor_name);
    setTimeout(() => setVendorAddToast(null), 3500);
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatApprovedDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function openEdit(inv: SeedInvoice) {
    setSelected(inv);
    setEditingInvoice(inv.id);
    setEditDraft(recalcDraft(JSON.parse(JSON.stringify(inv))));
  }

  function openManualEntry(invoiceId: string) {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;
    setSelected(inv);
    setEditingInvoice(inv.id);
    setEditDraft(
      recalcDraft({
        ...inv,
        vendor_name: "",
        invoice_number: null,
        total: 0,
        line_items: [{ product: "", qty: 0, unit: "ea", unit_price: 0, extended_price: 0 }],
      })
    );
  }

  function saveEdit() {
    if (!editDraft) return;
    const next = recalcDraft(editDraft);
    setInvoices((prev) => prev.map((i) => (i.id === next.id ? next : i)));
    setSelected(null);
    setEditingInvoice(null);
    setEditDraft(null);
  }

  function cancelEdit() {
    setEditingInvoice(null);
    setEditDraft(null);
  }

  function approveInvoice(invoiceId: string) {
    setApprovedInvoices((prev) => ({ ...prev, [invoiceId]: new Date().toISOString() }));
  }

  function updateDraft(updater: (d: SeedInvoice) => SeedInvoice) {
    if (!editDraft) return;
    setEditDraft(recalcDraft(updater(editDraft)));
  }

  function updateLine(index: number, patch: Partial<SeedInvoiceLineItem>) {
    if (!editDraft) return;
    const items = [...editDraft.line_items];
    items[index] = recalcLine({ ...items[index], ...patch });
    setEditDraft(recalcDraft({ ...editDraft, line_items: items }));
  }

  function addLineItem() {
    if (!editDraft) return;
    setEditDraft({
      ...editDraft,
      line_items: [...editDraft.line_items, { product: "", qty: 0, unit: "ea", unit_price: 0, extended_price: 0 }],
    });
  }

  function removeLineItem(index: number) {
    if (!editDraft || editDraft.line_items.length <= 1) return;
    const items = editDraft.line_items.filter((_, i) => i !== index);
    const total = items.reduce((s, l) => s + l.extended_price, 0);
    setEditDraft({ ...editDraft, line_items: items, total });
  }

  const isEditing = selected && editingInvoice === selected.id;
  const displayInvoice = isEditing && editDraft ? editDraft : selected;
  const approvedDate = selected ? approvedInvoices[selected.id] : null;

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
      {vendorAddToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600/20 border border-emerald-700/50 rounded-xl px-4 py-2.5 shadow-lg shadow-black/30 animate-slide-up">
          <p className="text-xs text-emerald-300">
            {vendorAddToast.includes("—") ? vendorAddToast : `${vendorAddToast} entry added to Vendor Tracker`}
          </p>
        </div>
      )}

      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-2xl">Invoice Scanner</h1>
            <EducationInfoIcon metricKey="invoice_scanning" />
            <EducationInfoIcon metricKey="vendor_matching" size="sm" />
          </div>
          <ExportButton
            pageName="Invoices"
            getData={() => ({
              headers: ["Vendor", "Date", "Invoice #", "Total", "Status"],
              rows: invoices.map((inv) => [
                inv.vendor_name,
                inv.invoice_date ?? "",
                inv.invoice_number ?? "",
                String(inv.total.toFixed(2)),
                inv.status,
              ]),
            })}
          />
        </div>
        <p className="text-xs text-muted">
          Snap a photo of any vendor invoice. AI extracts every line item and price.
        </p>

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

      <div className="px-3 sm:px-5 space-y-2">
        <h2 className="text-sm font-medium text-slate-400 px-1">Recent invoices</h2>
        {invoices.map((inv) => {
          if (inv.status === "failed") {
            return (
              <div
                key={inv.id}
                className="bg-slate-800 rounded-xl border border-amber-800/50 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">Scan Failed</span>
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  This invoice couldn&apos;t be read automatically. Tap to enter manually.
                </p>
                <button
                  type="button"
                  onClick={() => openManualEntry(inv.id)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Enter Manually →
                </button>
              </div>
            );
          }
          return (
            <div
              key={inv.id}
              className="w-full text-left rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(inv)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="font-semibold text-white truncate">{inv.vendor_name}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {formatDate(inv.invoice_date)}
                    {inv.invoice_number && <span className="ml-2">#{inv.invoice_number}</span>}
                  </p>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(inv);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4 text-slate-400" />
                  </button>
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
              {approvedInvoices[inv.id] ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-3">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approved {formatApprovedDate(approvedInvoices[inv.id])}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => approveInvoice(inv.id)}
                  className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-700/50 text-xs text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve Invoice</span>
                </button>
              )}

              {(() => {
                const matched = matchVendor(inv.vendor_name, selectedStore);
                const promptState = vendorPrompts[inv.id];

                if (matched && promptState !== "added" && promptState !== "dismissed") {
                  return (
                    <div className="mt-3 p-3 rounded-lg bg-blue-950/30 border border-blue-800/50">
                      <p className="text-xs text-blue-300 mb-2">
                        This looks like a <span className="text-white font-medium">{matched.vendor_name}</span> invoice
                        for <span className="text-white font-medium">{formatDollars(inv.total)}</span>. Add to vendor
                        tracker?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddToVendorTracker(inv, matched)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-700/50 text-xs text-blue-400 hover:bg-blue-600/30 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVendorPrompts((prev) => ({ ...prev, [inv.id]: "dismissed" }))}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-400"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                }

                if (promptState === "added") {
                  return (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                      <Check className="w-3 h-3" />
                      <span>Added to Vendor Tracker</span>
                    </div>
                  );
                }

                if (!matched && inv.vendor_name !== "Unknown" && promptState !== "dismissed") {
                  return (
                    <div className="mt-3 p-3 rounded-lg bg-amber-950/30 border border-amber-800/50">
                      <p className="text-xs text-amber-300 mb-2">
                        New vendor detected: <span className="text-white font-medium">{inv.vendor_name}</span>. Add to
                        your vendor database?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleNewVendorDetected(inv)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-700/50 text-xs text-amber-400 hover:bg-amber-600/30 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Vendor</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVendorPrompts((prev) => ({ ...prev, [inv.id]: "dismissed" }))}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-400"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          );
        })}
      </div>

      {selected && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-0 sm:p-4"
            onClick={() => {
              if (!isEditing) setSelected(null);
            }}
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
                  {isEditing && editDraft ? (
                    <input
                      id="invoice-detail-title"
                      value={editDraft.vendor_name}
                      onChange={(e) => updateDraft((d) => ({ ...d, vendor_name: e.target.value }))}
                      className="bg-slate-700 border border-slate-600 rounded-lg text-sm h-8 px-2 w-full max-w-[240px] text-white font-bold text-lg"
                      placeholder="Vendor name"
                    />
                  ) : (
                    <h2 id="invoice-detail-title" className="text-lg font-bold text-white">
                      {displayInvoice?.vendor_name}
                    </h2>
                  )}
                  <p className="text-sm text-slate-400 mt-0.5">
                    {formatDate(displayInvoice?.invoice_date ?? null)}
                    {displayInvoice?.invoice_number && ` · #${displayInvoice.invoice_number}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="px-3 py-1.5 rounded-lg bg-brand text-white text-sm hover:opacity-90"
                      >
                        Save
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing) cancelEdit();
                      setSelected(null);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Line items</span>
                  <span className="text-white font-semibold tabular-nums">
                    Total ${(displayInvoice?.total ?? 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {isEditing && editDraft ? (
                  <div className="space-y-2 overflow-x-auto">
                    {editDraft.line_items.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[minmax(100px,1fr)_60px_60px_80px_80px_32px] gap-2 items-center py-2 border-b border-slate-700/50 last:border-0 text-sm min-w-0"
                      >
                        <input
                          value={item.product}
                          onChange={(e) => updateLine(idx, { product: e.target.value })}
                          className="bg-slate-700 border border-slate-600 rounded-lg text-sm h-8 px-2 text-white min-w-0"
                          placeholder="Product"
                        />
                        <input
                          type="number"
                          min={0}
                          value={item.qty || ""}
                          onChange={(e) => updateLine(idx, { qty: Number(e.target.value) || 0 })}
                          className="bg-slate-700 border border-slate-600 rounded-lg text-sm h-8 px-2 text-white w-14"
                        />
                        <input
                          value={item.unit}
                          onChange={(e) => updateLine(idx, { unit: e.target.value })}
                          className="bg-slate-700 border border-slate-600 rounded-lg text-sm h-8 px-2 text-white w-14"
                          placeholder="Unit"
                        />
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unit_price || ""}
                          onChange={(e) => updateLine(idx, { unit_price: Number(e.target.value) || 0 })}
                          className="bg-slate-700 border border-slate-600 rounded-lg text-sm h-8 px-2 text-white w-18"
                        />
                        <span className="text-white tabular-nums text-xs">
                          ${item.extended_price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="p-1 rounded text-slate-400 hover:text-red-400"
                          aria-label="Remove line"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="text-sm text-blue-400 hover:text-blue-300 mt-2"
                    >
                      + Add line item
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {(displayInvoice?.line_items?.length ? displayInvoice.line_items : []).map(
                      (item: SeedInvoiceLineItem, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-700/50 last:border-0 text-sm"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="text-sm text-white truncate">{item.product}</div>
                            <div className="text-xs text-slate-500">
                              {item.qty} {item.unit} × ${item.unit_price.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-sm text-white font-medium tabular-nums shrink-0">
                            ${item.extended_price.toFixed(2)}
                          </div>
                        </li>
                      )
                    )}
                    {(!displayInvoice?.line_items?.length) && (
                      <li className="text-slate-500 text-sm py-4">No line items.</li>
                    )}
                  </ul>
                )}
                <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Total</span>
                  <span className="text-lg font-bold text-white tabular-nums">
                    ${(displayInvoice?.total ?? 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
