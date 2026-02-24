"use client";

import { useState, useMemo } from "react";
import { Settings, Check, Pencil, Archive } from "lucide-react";
import {
  VENDORS,
  VENDOR_CATEGORIES,
  STORE_DETAILS,
  type Vendor,
} from "@/src/lib/vendor-data";
import { SEED_STORES } from "@/src/lib/seed-data";
import { formatDollars } from "@/src/lib/formatters";

const STORE_PREFIX: Record<string, string> = { kent: "knt", aurora: "aur", lindseys: "lin" };
const STORE_OPTIONS = SEED_STORES.map((s) => ({ value: s.slug, label: s.name }));

const ALL_PLATFORMS = [
  { id: "doordash", name: "DoorDash", icon: "🚗", desc: "Commission: 15-30%" },
  { id: "ubereats", name: "UberEats", icon: "🍔", desc: "Commission: 15-30%" },
  { id: "grubhub", name: "Grubhub", icon: "🥡", desc: "Commission: 15-30%" },
  { id: "slice", name: "Slice", icon: "🍕", desc: "Flat fee per order" },
  { id: "direct", name: "Direct Online", icon: "🌐", desc: "Your website — lowest fees" },
  { id: "other", name: "Other", icon: "📦", desc: "Custom platform" },
];

type LeaseState = {
  monthlyRent: number;
  sqft: number;
  leaseRenewal: string;
  ccProcessor: string;
  ccQuotedRate: string;
};

function initialLeaseDetails(): Record<string, LeaseState> {
  const r: Record<string, LeaseState> = {};
  for (const k of Object.keys(STORE_DETAILS)) {
    const d = STORE_DETAILS[k];
    r[k] = { ...d, ccProcessor: "Square", ccQuotedRate: "2.60" };
  }
  return r;
}

export default function VendorSettingsPage() {
  const [selectedStore, setSelectedStore] = useState("kent");
  const [vendors, setVendors] = useState<Vendor[]>(() => VENDORS.filter((v) => v.store_id === selectedStore));
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"vendors" | "platforms" | "lease">("vendors");

  const [vendorName, setVendorName] = useState("");
  const [vendorCategory, setVendorCategory] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [activePlatforms, setActivePlatforms] = useState(["doordash", "ubereats"]);
  const [leaseDetails, setLeaseDetails] = useState<Record<string, LeaseState>>(initialLeaseDetails);

  const storeVendors = useMemo(() => vendors.filter((v) => v.store_id === selectedStore), [vendors, selectedStore]);
  const sortedStoreVendors = useMemo(
    () => [...storeVendors].sort((a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1)),
    [storeVendors]
  );

  const currentLease = leaseDetails[selectedStore] ?? {
    ...STORE_DETAILS[selectedStore],
    ccProcessor: "Square",
    ccQuotedRate: "2.60",
  } as LeaseState;

  // Sync vendors when store changes (re-filter from full list for fresh load)
  const effectiveVendors = useMemo(() => {
    const fromStore = vendors.filter((v) => v.store_id === selectedStore);
    if (fromStore.length > 0) return vendors;
    return [...vendors, ...VENDORS.filter((v) => v.store_id === selectedStore)];
  }, [vendors, selectedStore]);

  const vendorsForCurrentStore = useMemo(
    () => effectiveVendors.filter((v) => v.store_id === selectedStore),
    [effectiveVendors, selectedStore]
  );
  const sortedVendorsForStore = useMemo(
    () => [...vendorsForCurrentStore].sort((a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1)),
    [vendorsForCurrentStore]
  );

  const openAddVendor = () => {
    setVendorName("");
    setVendorCategory("");
    setContactName("");
    setPhone("");
    setEmail("");
    setAccountNumber("");
    setNotes("");
    setEditingVendor(null);
    setShowAddVendor(true);
  };

  const startEdit = (v: Vendor) => {
    setVendorName(v.vendor_name);
    setVendorCategory(v.category);
    setContactName(v.contact_name ?? "");
    setPhone(v.phone ?? "");
    setEmail(v.email ?? "");
    setAccountNumber(v.account_number ?? "");
    setNotes(v.notes ?? "");
    setEditingVendor(v.id);
    setShowAddVendor(true);
  };

  const closeVendorSheet = () => {
    setShowAddVendor(false);
    setEditingVendor(null);
  };

  const saveVendor = () => {
    if (!vendorName.trim() || !vendorCategory.trim()) return;
    const prefix = STORE_PREFIX[selectedStore] ?? "st";
    const storeVendorsForId = vendors.filter((v) => v.store_id === selectedStore);
    const maxNum = storeVendorsForId.reduce((max, v) => {
      const n = parseInt(v.id.split("-").pop() ?? "0", 10);
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 0);

    if (editingVendor) {
      setVendors((prev) =>
        prev.map((v) =>
          v.id === editingVendor
            ? {
                ...v,
                vendor_name: vendorName.trim(),
                category: vendorCategory,
                contact_name: contactName.trim(),
                phone: phone.trim(),
                email: email.trim(),
                account_number: accountNumber.trim(),
                notes: notes.trim(),
              }
            : v
        )
      );
    } else {
      const newVendor: Vendor = {
        id: `v-${prefix}-${maxNum + 1}`,
        store_id: selectedStore,
        vendor_name: vendorName.trim(),
        category: vendorCategory,
        contact_name: contactName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        account_number: accountNumber.trim(),
        is_active: true,
        notes: notes.trim(),
      };
      setVendors((prev) => [...prev, newVendor]);
    }
    closeVendorSheet();
  };

  const toggleActive = (id: string) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, is_active: !v.is_active } : v)));
  };

  const togglePlatform = (id: string) => {
    setActivePlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSaveLease = () => {
    setLeaseDetails((prev) => ({
      ...prev,
      [selectedStore]: {
        ...currentLease,
        monthlyRent: Number(currentLease.monthlyRent) || 0,
        sqft: Number(currentLease.sqft) || 0,
        leaseRenewal: currentLease.leaseRenewal,
        ccProcessor: currentLease.ccProcessor,
        ccQuotedRate: currentLease.ccQuotedRate,
      },
    }));
  };

  const monthlyRent = typeof currentLease.monthlyRent === "number" ? currentLease.monthlyRent : Number(currentLease.monthlyRent) || 0;
  const sqft = typeof currentLease.sqft === "number" ? currentLease.sqft : Number(currentLease.sqft) || 0;

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Vendor Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage vendors, platforms, and lease details</p>
        </div>
        <Settings className="w-5 h-5 text-slate-500 shrink-0" />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Store:</label>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="dashboard-input rounded-lg border border-slate-600 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand/60 focus:outline-none"
        >
          {STORE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 mb-4">
        {(["vendors", "platforms", "lease"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              activeTab === tab ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "vendors" && (
        <>
          <button
            type="button"
            onClick={openAddVendor}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-600 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors mb-3"
          >
            + Add New Vendor
          </button>

          {sortedVendorsForStore.map((v) => (
            <div key={v.id} className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">{v.vendor_name}</div>
                  <div className="text-xs text-slate-500">{v.category}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(v)}
                    className="p-1.5 rounded-lg hover:bg-slate-700"
                    aria-label="Edit vendor"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(v.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-700"
                    aria-label={v.is_active ? "Deactivate" : "Reactivate"}
                  >
                    <Archive className={`w-3.5 h-3.5 ${v.is_active ? "text-slate-400" : "text-red-400"}`} />
                  </button>
                </div>
              </div>
              {(v.contact_name || v.phone) && (
                <div className="text-xs text-slate-500 mt-1">
                  {v.contact_name && <span>{v.contact_name}</span>}
                  {v.contact_name && v.phone && " · "}
                  {v.phone && <span>{v.phone}</span>}
                </div>
              )}
              {!v.is_active && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-600/20 text-red-400 mt-1 inline-block">
                  Inactive
                </span>
              )}
            </div>
          ))}
        </>
      )}

      {activeTab === "platforms" && (
        <div className="space-y-2">
          {ALL_PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlatform(p.id)}
              className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-colors text-left ${
                activePlatforms.includes(p.id)
                  ? "bg-slate-700/50 border-emerald-700/50"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <span className="text-lg">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">{p.name}</div>
                <div className="text-xs text-slate-500">{p.desc}</div>
              </div>
              {activePlatforms.includes(p.id) && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
            </button>
          ))}
          <p className="text-xs text-slate-500 mt-3">
            Selected platforms appear in Delivery Economics. Only platforms you actually use should be active.
          </p>
        </div>
      )}

      {activeTab === "lease" && (
        <>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Monthly Rent ($)</label>
              <input
                type="number"
                value={currentLease.monthlyRent}
                onChange={(e) =>
                  setLeaseDetails((prev) => ({
                    ...prev,
                    [selectedStore]: { ...(prev[selectedStore] ?? currentLease), monthlyRent: Number(e.target.value) || 0 },
                  }))
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Square Footage</label>
              <input
                type="number"
                value={currentLease.sqft}
                onChange={(e) =>
                  setLeaseDetails((prev) => ({
                    ...prev,
                    [selectedStore]: { ...(prev[selectedStore] ?? currentLease), sqft: Number(e.target.value) || 0 },
                  }))
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Lease Renewal Year</label>
              <input
                type="text"
                value={currentLease.leaseRenewal}
                onChange={(e) =>
                  setLeaseDetails((prev) => ({
                    ...prev,
                    [selectedStore]: { ...(prev[selectedStore] ?? currentLease), leaseRenewal: e.target.value },
                  }))
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Credit Card Processor</label>
              <input
                type="text"
                value={currentLease.ccProcessor}
                onChange={(e) =>
                  setLeaseDetails((prev) => ({
                    ...prev,
                    [selectedStore]: { ...(prev[selectedStore] ?? currentLease), ccProcessor: e.target.value },
                  }))
                }
                placeholder="Square"
                className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Quoted Processing Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={currentLease.ccQuotedRate}
                onChange={(e) =>
                  setLeaseDetails((prev) => ({
                    ...prev,
                    [selectedStore]: { ...(prev[selectedStore] ?? currentLease), ccQuotedRate: e.target.value },
                  }))
                }
                placeholder="2.60"
                className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveLease}
              className="w-full py-3 rounded-xl bg-[#E65100] hover:bg-orange-600 text-white text-sm font-semibold mt-2 transition-colors"
            >
              Save Changes
            </button>
          </div>

          <div className="bg-slate-700/50 rounded-xl p-3 mt-3">
            <h4 className="text-xs text-slate-500 mb-2">Computed from your data</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Rent/sq ft: </span>
                <span className="text-white">
                  ${sqft > 0 ? (monthlyRent / sqft).toFixed(2) : "—"}/mo
                </span>
              </div>
              <div>
                <span className="text-slate-500">Annual rent: </span>
                <span className="text-white">{formatDollars(monthlyRent * 12)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {showAddVendor && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={closeVendorSheet} />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-800 rounded-t-2xl border-t border-slate-700 p-5 pb-28 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-4">
              {editingVendor ? "Edit Vendor" : "Add New Vendor"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Vendor Name (required)</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
                  placeholder="Acme Supplies"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Category (required)</label>
                <select
                  value={vendorCategory}
                  onChange={(e) => setVendorCategory(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
                >
                  <option value="">Select category...</option>
                  {VENDOR_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Contact Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  type="button"
                  onClick={closeVendorSheet}
                  className="py-3 rounded-xl bg-slate-700 text-slate-300 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveVendor}
                  disabled={!vendorName.trim() || !vendorCategory}
                  className="py-3 rounded-xl bg-[#E65100] hover:bg-orange-600 text-white text-sm font-semibold disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
