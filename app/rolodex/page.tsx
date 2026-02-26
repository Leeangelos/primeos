"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { SEED_TRUSTED_CONTACTS, type SeedContact } from "@/src/lib/seed-data";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "vendor", label: "Vendors" },
  { key: "repairs", label: "Repairs" },
  { key: "professional", label: "Professional" },
  { key: "other", label: "Other" },
] as const;

type Category = (typeof CATEGORIES)[number]["key"];

// Map seed category to filter category (service_contract → repairs for display)
const CATEGORY_LABELS: Record<string, string> = {
  vendor: "Vendor",
  skilled_labor: "Repairs",
  service_contract: "Repairs",
  professional: "Professional",
  other: "Other",
};

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] || cat;
}

function matchesFilter(c: SeedContact, filter: Category): boolean {
  if (filter === "all") return true;
  if (filter === "repairs") return c.category === "service_contract" || c.category === "skilled_labor";
  return c.category === filter;
}

export default function RolodexPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Category>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SeedContact | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEducation, setShowEducation] = useState(false);

  const [fName, setFName] = useState("");
  const [fCategory, setFCategory] = useState("vendor");
  const [fPhone, setFPhone] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fNotes, setFNotes] = useState("");

  // Demo: always use seed data (no API), so we never have empty state
  const allContacts = SEED_TRUSTED_CONTACTS;

  const filteredContacts = useMemo(() => {
    let list = allContacts.filter((c) => matchesFilter(c, filter));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q)) ||
          (c.phone?.includes(q)) ||
          (c.notes?.toLowerCase().includes(q)) ||
          categoryLabel(c.category).toLowerCase().includes(q)
      );
    }
    return list;
  }, [allContacts, filter, search]);

  function resetForm() {
    setFName("");
    setFCategory("vendor");
    setFPhone("");
    setFEmail("");
    setFNotes("");
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(c: SeedContact) {
    setFName(c.name);
    setFCategory(c.category);
    setFPhone(c.phone || "");
    setFEmail(c.email || "");
    setFNotes(c.notes || "");
    setEditing(c);
    setShowForm(true);
  }

  function handleSave() {
    if (!fName.trim()) return;
    setSaving(true);
    // Demo: no API; just close form and refresh would re-show seed. For real app you'd POST/PUT.
    setSaving(false);
    resetForm();
  }

  const inputCls =
    "w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-muted/50 focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none";

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Trusted Rolodex</h1>
          <button
            type="button"
            onClick={() => setShowEducation(true)}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold"
            aria-label="Learn more"
          >
            i
          </button>
        </div>

        {/* Search bar — full width, h-12 */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className={cn(
            "w-full h-12 rounded-xl border border-border/50 bg-black/30 px-4 text-sm text-white placeholder:text-slate-500",
            "focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none"
          )}
          aria-label="Search contacts"
        />

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={cn(
                "min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors shrink-0",
                filter === c.key
                  ? "border-brand/50 bg-brand/15 text-brand"
                  : "border-border/50 bg-black/30 text-muted hover:border-border hover:bg-black/40"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact cards */}
      <div className="space-y-3 px-3 sm:px-5">
        {filteredContacts.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{c.name}</p>
                <p className="text-slate-400 text-sm mt-0.5">{categoryLabel(c.category)}</p>
                {c.phone && (
                  <a
                    href={`tel:${c.phone.replace(/\D/g, "")}`}
                    className="flex items-center gap-1.5 min-h-[44px] py-2 text-blue-400 text-sm font-medium hover:underline active:opacity-70"
                  >
                    {c.phone}
                  </a>
                )}
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center gap-1.5 min-h-[44px] py-2 text-blue-400 text-sm font-medium hover:underline active:opacity-70 break-all"
                  >
                    {c.email}
                  </a>
                )}
                {c.notes && (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{c.notes}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => startEdit(c)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-muted hover:text-white px-3 py-2 rounded-lg border border-slate-600 hover:border-slate-500 shrink-0"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact — fixed bottom-right FAB */}
      <button
        type="button"
        onClick={() => {
          resetForm();
          setShowForm(true);
        }}
        className="fixed bottom-20 right-4 sm:right-6 w-14 h-14 rounded-full bg-brand text-white shadow-lg hover:bg-brand/90 active:scale-95 flex items-center justify-center text-2xl font-light"
        aria-label="Add contact"
      >
        +
      </button>

      {/* Add/Edit form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => resetForm()}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => resetForm()}
              className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="text-base font-semibold text-brand mb-4">
              {editing ? "Edit Contact" : "Add Contact"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Name *</label>
                <input
                  type="text"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="e.g. Joe's Plumbing"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Category *</label>
                <select
                  value={fCategory}
                  onChange={(e) => setFCategory(e.target.value)}
                  className={inputCls}
                >
                  <option value="vendor">Vendors</option>
                  <option value="service_contract">Repairs</option>
                  <option value="professional">Professional</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Phone</label>
                <input
                  type="tel"
                  value={fPhone}
                  onChange={(e) => setFPhone(e.target.value)}
                  placeholder="(330) 555-1234"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Email</label>
                <input
                  type="email"
                  value={fEmail}
                  onChange={(e) => setFEmail(e.target.value)}
                  placeholder="joe@example.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Notes</label>
                <textarea
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Optional notes"
                  rows={2}
                  className={cn(inputCls, "resize-y min-h-[3rem]")}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !fName.trim()}
                className="flex-1 rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/25 disabled:opacity-50"
              >
                {saving ? "Saving…" : editing ? "Update" : "Add Contact"}
              </button>
              <button
                type="button"
                onClick={() => resetForm()}
                className="rounded-lg border border-border/50 bg-black/30 px-4 py-2.5 text-sm text-muted hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEducation &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setShowEducation(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowEducation(false)}
                className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2"
                aria-label="Close"
              >
                ✕
              </button>
              <h3 className="text-base font-semibold text-brand mb-1">🎓 Owner-Controlled Vendor List</h3>
              <p className="text-xs text-muted mb-4">Why your contact list is a Gross Profit lever.</p>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-white mb-1">Why Owner-Controlled Vendor Lists Matter</h4>
                  <p className="text-muted text-xs leading-relaxed">
                    When the owner holds the vendor relationships — not a random manager or a Google search — you keep negotiating power. One shop we know had three different people calling the same paper supplier; the supplier had no reason to give a break. One contact, one relationship, one price. That&apos;s the rolodex.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">How Random Google Calls Lose You Money</h4>
                  <p className="text-muted text-xs leading-relaxed">
                    Every time someone new calls a vendor, you&apos;re a new customer. New customers don&apos;t get the best terms. You lose volume discounts, loyalty pricing, and the ability to say &quot;we&apos;ve been with you for five years.&quot; Centralize contacts here. When someone needs a plumber or a flour quote, they use this list. You re-bid from strength.
                  </p>
                </div>
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                  <h4 className="font-medium text-red-400 text-xs mb-2">📕 When Vendors Drift</h4>
                  <p className="text-muted text-xs leading-relaxed">
                    If you haven&apos;t updated the rolodex in a year, prices have crept. Call each vendor category once a quarter. Get one quote from a competitor and use it. &quot;I&apos;m getting X from someone else — can you match it?&quot; That call saves more than the hour it takes. Put the winner in the rolodex and own the relationship.
                  </p>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
