"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "vendor", label: "Vendors" },
  { key: "skilled_labor", label: "Skilled Labor" },
  { key: "service_contract", label: "Service Contracts" },
  { key: "professional", label: "Professional" },
] as const;

type Category = (typeof CATEGORIES)[number]["key"];

type Contact = {
  id: string;
  category: string;
  name: string;
  phone: string | null;
  email: string | null;
  account_number: string | null;
  notes: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  vendor: "Vendor",
  skilled_labor: "Skilled Labor",
  service_contract: "Service Contract",
  professional: "Professional",
};

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] || cat;
}

export default function RolodexPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form fields
  const [fName, setFName] = useState("");
  const [fCategory, setFCategory] = useState("vendor");
  const [fPhone, setFPhone] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fAccount, setFAccount] = useState("");
  const [fNotes, setFNotes] = useState("");

  const loadContacts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/trusted-contacts?category=${filter}`);
    const data = await res.json();
    if (data.ok) setContacts(data.contacts);
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  function resetForm() {
    setFName(""); setFCategory("vendor"); setFPhone(""); setFEmail(""); setFAccount(""); setFNotes("");
    setEditing(null); setShowForm(false);
  }

  function startEdit(c: Contact) {
    setFName(c.name);
    setFCategory(c.category);
    setFPhone(c.phone || "");
    setFEmail(c.email || "");
    setFAccount(c.account_number || "");
    setFNotes(c.notes || "");
    setEditing(c);
    setShowForm(true);
  }

  async function handleSave() {
    if (!fName.trim()) return;
    setSaving(true);

    const payload = {
      name: fName.trim(),
      category: fCategory,
      phone: fPhone.trim() || null,
      email: fEmail.trim() || null,
      account_number: fAccount.trim() || null,
      notes: fNotes.trim() || null,
    };

    if (editing) {
      await fetch("/api/trusted-contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...payload }),
      });
    } else {
      await fetch("/api/trusted-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    resetForm();
    loadContacts();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/trusted-contacts?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    loadContacts();
  }

  const inputCls = "w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-muted/50 focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none";

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold sm:text-2xl">Trusted Rolodex</h1>
          <button
            type="button"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/25"
          >
            + Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Category)}
            className="sm:hidden rounded-lg border border-border/50 bg-black/30 px-3 py-2 text-sm font-medium text-brand focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <div className="hidden sm:flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
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
      </div>

      {/* Contact list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-4 animate-pulse">
              <div className="h-4 w-40 bg-muted/20 rounded mb-2" />
              <div className="h-3 w-24 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">
          No contacts yet. Tap "+ Add" to create your first one.
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-border/50 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white truncate">{c.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted bg-muted/10 px-2 py-0.5 rounded">
                      {categoryLabel(c.category)}
                    </span>
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-1.5 text-brand text-sm font-medium mt-1 active:opacity-70"
                    >
                      📞 {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="text-sm text-muted hover:text-white mt-1 block truncate"
                    >
                      ✉ {c.email}
                    </a>
                  )}
                  {c.account_number && (
                    <div className="text-xs text-muted mt-1">Acct: {c.account_number}</div>
                  )}
                  {c.notes && (
                    <div className="text-xs text-muted/70 mt-1 italic">{c.notes}</div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="text-xs text-muted hover:text-white px-2 py-1 rounded border border-border/30 hover:border-border/60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/20 hover:border-red-500/40 disabled:opacity-50"
                  >
                    {deleting === c.id ? "..." : "Del"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => resetForm()}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => resetForm()}
              className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none"
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
                  <option value="vendor">Vendor</option>
                  <option value="skilled_labor">Skilled Labor</option>
                  <option value="service_contract">Service Contract</option>
                  <option value="professional">Professional</option>
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
                  placeholder="joe@plumbing.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Account Number</label>
                <input
                  type="text"
                  value={fAccount}
                  onChange={(e) => setFAccount(e.target.value)}
                  placeholder="Optional"
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
    </div>
  );
}
