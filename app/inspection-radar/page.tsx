"use client";

import { useState, useEffect, useMemo } from "react";
import { Shield, ShieldAlert, ShieldCheck, ChevronDown, Circle, FileText, ExternalLink } from "lucide-react";
import { SEED_STORES } from "@/src/lib/seed-data";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";

// Operator's own inspection history
interface OwnInspection {
  id: string;
  store: string;
  storeId: string;
  date: string;
  type: string;
  criticalViolations: number;
  nonCriticalViolations: number;
  details: string[];
  correctedOnSite: number;
  inspector: string;
  county: string;
}

const OWN_INSPECTIONS: OwnInspection[] = [
  {
    id: "own1",
    store: "LeeAngelo's Kent",
    storeId: "kent",
    date: "2025-10-15",
    type: "Standard",
    criticalViolations: 0,
    nonCriticalViolations: 2,
    details: ["Equipment cleanliness — prep table edge (non-critical, corrected)", "Floor tile grout in walk-in needs resealing (non-critical)"],
    correctedOnSite: 1,
    inspector: "Portage County Health District",
    county: "Portage",
  },
  {
    id: "own2",
    store: "LeeAngelo's Kent",
    storeId: "kent",
    date: "2025-04-08",
    type: "Standard",
    criticalViolations: 1,
    nonCriticalViolations: 1,
    details: ["Handwashing sink partially obstructed by bus tub (critical, corrected on site)", "Ceiling vent above prep area needs cleaning (non-critical)"],
    correctedOnSite: 1,
    inspector: "Portage County Health District",
    county: "Portage",
  },
  {
    id: "own3",
    store: "LeeAngelo's Aurora",
    storeId: "aurora",
    date: "2025-11-20",
    type: "Standard",
    criticalViolations: 0,
    nonCriticalViolations: 1,
    details: ["Light shield missing above prep station (non-critical)"],
    correctedOnSite: 0,
    inspector: "Portage County Health District",
    county: "Portage",
  },
  {
    id: "own4",
    store: "LeeAngelo's Aurora",
    storeId: "aurora",
    date: "2025-05-12",
    type: "Standard",
    criticalViolations: 0,
    nonCriticalViolations: 0,
    details: [],
    correctedOnSite: 0,
    inspector: "Portage County Health District",
    county: "Portage",
  },
  {
    id: "own5",
    store: "Lindsey's",
    storeId: "lindseys",
    date: "2025-09-03",
    type: "Standard",
    criticalViolations: 1,
    nonCriticalViolations: 3,
    details: [
      "Cold holding unit at 43°F — above 41°F threshold (critical, corrected on site)",
      "Employee break items stored near food prep area (non-critical)",
      "Sanitizer test strips expired (non-critical, corrected)",
      "Back door seal has gap (non-critical)",
    ],
    correctedOnSite: 2,
    inspector: "Stark County Health Department",
    county: "Stark",
  },
  {
    id: "own6",
    store: "Lindsey's",
    storeId: "lindseys",
    date: "2025-03-18",
    type: "Standard",
    criticalViolations: 0,
    nonCriticalViolations: 1,
    details: ["Mop sink area needs better drainage (non-critical)"],
    correctedOnSite: 0,
    inspector: "Stark County Health Department",
    county: "Stark",
  },
];

// Nearby inspection activity (what the radar tracks)
interface NearbyInspection {
  id: string;
  establishment: string;
  address: string;
  distance: number;
  date: string;
  criticalViolations: number;
  nonCriticalViolations: number;
  type: string;
  county: string;
  nearStore: string;
}

const NEARBY_INSPECTIONS_KENT: NearbyInspection[] = [
  { id: "n1", establishment: "China Star", address: "135 E Main St, Kent", distance: 0.3, date: "2026-02-24", criticalViolations: 2, nonCriticalViolations: 4, type: "Standard", county: "Portage", nearStore: "kent" },
  { id: "n2", establishment: "Taco Bell", address: "1075 S Water St, Kent", distance: 0.8, date: "2026-02-24", criticalViolations: 0, nonCriticalViolations: 1, type: "Standard", county: "Portage", nearStore: "kent" },
  { id: "n3", establishment: "Rosie's Italian Grille", address: "210 W Erie St, Kent", distance: 0.4, date: "2026-02-23", criticalViolations: 1, nonCriticalViolations: 2, type: "Standard", county: "Portage", nearStore: "kent" },
  { id: "n4", establishment: "Ray's Place", address: "135 Franklin Ave, Kent", distance: 0.2, date: "2026-02-23", criticalViolations: 0, nonCriticalViolations: 3, type: "Standard", county: "Portage", nearStore: "kent" },
  { id: "n5", establishment: "Mike's Place", address: "1700 SR 59, Kent", distance: 1.2, date: "2026-02-22", criticalViolations: 1, nonCriticalViolations: 1, type: "Follow-up", county: "Portage", nearStore: "kent" },
  { id: "n6", establishment: "Panini's Bar & Grill", address: "235 N Water St, Kent", distance: 0.5, date: "2026-02-22", criticalViolations: 0, nonCriticalViolations: 2, type: "Standard", county: "Portage", nearStore: "kent" },
  { id: "n7", establishment: "Subway", address: "310 S Water St, Kent", distance: 0.6, date: "2026-02-21", criticalViolations: 0, nonCriticalViolations: 0, type: "Standard", county: "Portage", nearStore: "kent" },
  { id: "n8", establishment: "Pizza Hut", address: "1096 S Water St, Kent", distance: 0.9, date: "2026-02-20", criticalViolations: 1, nonCriticalViolations: 2, type: "Standard", county: "Portage", nearStore: "kent" },
  { id: "n9", establishment: "Sakura Japanese", address: "138 N Water St, Kent", distance: 0.4, date: "2026-02-19", criticalViolations: 0, nonCriticalViolations: 1, type: "Standard", county: "Portage", nearStore: "kent" },
  { id: "n10", establishment: "Twisted Meltz", address: "150 E Main St, Kent", distance: 0.3, date: "2026-02-18", criticalViolations: 0, nonCriticalViolations: 0, type: "Standard", county: "Portage", nearStore: "kent" },
];

const NEARBY_INSPECTIONS_AURORA: NearbyInspection[] = [
  { id: "na1", establishment: "McDonald's", address: "94 Barrington Town Ctr, Aurora", distance: 0.5, date: "2026-02-25", criticalViolations: 1, nonCriticalViolations: 2, type: "Standard", county: "Portage", nearStore: "aurora" },
  { id: "na2", establishment: "Yours Truly", address: "60 Barrington Town Ctr, Aurora", distance: 0.4, date: "2026-02-23", criticalViolations: 0, nonCriticalViolations: 1, type: "Standard", county: "Portage", nearStore: "aurora" },
  { id: "na3", establishment: "Chipotle", address: "240 W Garfield Rd, Aurora", distance: 1.1, date: "2026-02-21", criticalViolations: 0, nonCriticalViolations: 0, type: "Standard", county: "Portage", nearStore: "aurora" },
  { id: "na4", establishment: "Cravings Cafe", address: "15 Aurora Commons", distance: 0.3, date: "2026-02-19", criticalViolations: 0, nonCriticalViolations: 2, type: "Standard", county: "Portage", nearStore: "aurora" },
];

const NEARBY_INSPECTIONS_LINDSEYS: NearbyInspection[] = [
  { id: "nl1", establishment: "Bellacino's", address: "2739 Whipple Ave NW, Canton", distance: 0.2, date: "2026-02-25", criticalViolations: 0, nonCriticalViolations: 1, type: "Standard", county: "Stark", nearStore: "lindseys" },
  { id: "nl2", establishment: "Arby's", address: "2650 Whipple Ave NW, Canton", distance: 0.3, date: "2026-02-24", criticalViolations: 1, nonCriticalViolations: 3, type: "Standard", county: "Stark", nearStore: "lindseys" },
  { id: "nl3", establishment: "Donatos Pizza", address: "4428 Belden Village St NW, Canton", distance: 1.5, date: "2026-02-22", criticalViolations: 0, nonCriticalViolations: 0, type: "Standard", county: "Stark", nearStore: "lindseys" },
  { id: "nl4", establishment: "Bob Evans", address: "4690 Mega St NW, Canton", distance: 1.8, date: "2026-02-20", criticalViolations: 2, nonCriticalViolations: 4, type: "Standard", county: "Stark", nearStore: "lindseys" },
  { id: "nl5", establishment: "Handel's Ice Cream", address: "2860 Whipple Ave NW, Canton", distance: 0.4, date: "2026-02-18", criticalViolations: 0, nonCriticalViolations: 0, type: "Standard", county: "Stark", nearStore: "lindseys" },
];

interface ThreatAssessment {
  level: "low" | "elevated" | "high" | "imminent";
  label: string;
  inspectionsThisWeek: number;
  fourWeekAverage: number;
  nearestDistance: number;
  nearestDate: string;
  nearestEstablishment: string;
}

function calculateThreat(nearbyInspections: NearbyInspection[]): ThreatAssessment {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = nearbyInspections.filter((i) => new Date(i.date) >= oneWeekAgo && i.distance <= 3);
  const within48hrs = nearbyInspections.filter((i) => {
    const d = new Date(i.date);
    return now.getTime() - d.getTime() <= 48 * 60 * 60 * 1000 && i.distance <= 0.5;
  });
  const withinHalfMile48 = within48hrs.length;
  const inspectionsThisWeek = thisWeek.length;

  const fourWeekAverage = 4;
  const sortedByDist = [...nearbyInspections].sort((a, b) => a.distance - b.distance);
  const nearest = sortedByDist[0];
  const nearestInLastWeek = thisWeek.length > 0 ? [...thisWeek].sort((a, b) => a.distance - b.distance)[0] : null;

  let level: "low" | "elevated" | "high" | "imminent" = "low";
  let label = "Normal activity in your area.";

  if (withinHalfMile48 >= 2) {
    level = "imminent";
    label = `${withinHalfMile48} inspections within half a mile in the last 48 hours.`;
  } else if (inspectionsThisWeek >= 8 || (inspectionsThisWeek >= 6 && nearestInLastWeek && nearestInLastWeek.distance <= 0.5)) {
    level = "high";
    label = `${inspectionsThisWeek} inspections within 3 miles this week. Inspector is actively in your area.`;
  } else if (inspectionsThisWeek >= Math.ceil(fourWeekAverage * 1.5)) {
    level = "elevated";
    label = `${inspectionsThisWeek} inspections within 3 miles this week. Above your area's normal activity.`;
  } else {
    level = "low";
    label = `${inspectionsThisWeek} inspections within 3 miles this week. Normal activity.`;
  }

  return {
    level,
    label,
    inspectionsThisWeek,
    fourWeekAverage,
    nearestDistance: nearest?.distance ?? 99,
    nearestDate: nearest?.date ?? "",
    nearestEstablishment: nearest?.establishment ?? "",
  };
}

interface ChecklistCategory {
  id: string;
  title: string;
  icon: string;
  items: { id: string; text: string; critical: boolean }[];
}

const CHECKLIST: ChecklistCategory[] = [
  {
    id: "temp",
    title: "Temperature Control",
    icon: "🌡️",
    items: [
      { id: "t1", text: "Walk-in cooler at or below 41°F", critical: true },
      { id: "t2", text: "Walk-in freezer at or below 0°F", critical: true },
      { id: "t3", text: "Hot holding items above 135°F", critical: true },
      { id: "t4", text: "Prep cooler and pizza makeline at or below 41°F", critical: true },
      { id: "t5", text: "Thermometers calibrated and present in all units", critical: false },
      { id: "t6", text: "Temperature logs up to date for the last 7 days", critical: false },
    ],
  },
  {
    id: "storage",
    title: "Food Storage",
    icon: "📦",
    items: [
      { id: "s1", text: "Raw proteins stored below ready-to-eat foods", critical: true },
      { id: "s2", text: "All prep items and opened items labeled with date", critical: true },
      { id: "s3", text: "Nothing stored directly on the floor (6-inch minimum)", critical: false },
      { id: "s4", text: "No expired items in walk-in, reach-in, or dry storage", critical: true },
      { id: "s5", text: "Chemicals stored separately from food items", critical: true },
      { id: "s6", text: "All containers covered or properly wrapped", critical: false },
    ],
  },
  {
    id: "handwash",
    title: "Handwashing",
    icon: "🧼",
    items: [
      { id: "h1", text: "All handwashing sinks accessible and unobstructed", critical: true },
      { id: "h2", text: "Soap and paper towels stocked at every station", critical: true },
      { id: "h3", text: "Handwashing signage posted", critical: false },
      { id: "h4", text: "No items stored in or on handwashing sinks", critical: true },
    ],
  },
  {
    id: "sanitation",
    title: "Cleaning & Sanitation",
    icon: "✨",
    items: [
      { id: "c1", text: "Sanitizer buckets at proper concentration (chlorine 50-100ppm or quat 200-400ppm)", critical: true },
      { id: "c2", text: "Test strips available and not expired", critical: false },
      { id: "c3", text: "Food-contact surfaces clean (cutting boards, slicers, prep tables)", critical: true },
      { id: "c4", text: "Three-compartment sink set up properly (wash, rinse, sanitize)", critical: true },
      { id: "c5", text: "Cleaning schedule documented and current", critical: false },
    ],
  },
  {
    id: "pest",
    title: "Pest Control",
    icon: "🪤",
    items: [
      { id: "p1", text: "No evidence of pest activity (droppings, nesting, live insects)", critical: true },
      { id: "p2", text: "Pest control documentation current", critical: false },
      { id: "p3", text: "Back door and entry points sealed — no gaps", critical: false },
      { id: "p4", text: "Dumpster area clean and lids closed", critical: false },
    ],
  },
  {
    id: "employee",
    title: "Employee Health & Hygiene",
    icon: "👤",
    items: [
      { id: "e1", text: "Illness reporting policy posted and employees informed", critical: true },
      { id: "e2", text: "No sick employees working the line", critical: true },
      { id: "e3", text: "Hair restraints worn by all food handlers", critical: false },
      { id: "e4", text: "No bare hand contact with ready-to-eat food (gloves or utensils)", critical: true },
    ],
  },
  {
    id: "docs",
    title: "Documentation",
    icon: "📋",
    items: [
      { id: "d1", text: "Food service license posted and current", critical: true },
      { id: "d2", text: "Person In Charge (PIC) certified employee on every shift", critical: true },
      { id: "d3", text: "Food handler certifications current for all employees", critical: false },
      { id: "d4", text: "Temperature logs accessible for inspector review", critical: false },
    ],
  },
];

const COMMON_PIZZA_VIOLATIONS = [
  "Temperature control — cold holding above 41°F (makeline, walk-in)",
  "Handwashing sink access — obstructed by equipment or supplies",
  "Date labeling — opened or prepped items not marked",
  "Sanitizer concentration — too weak or test strips expired",
  "Food-contact surfaces — cutting boards, slicer, or prep table not clean",
];

const STORE_OPTIONS = [
  { value: "all", label: "All Locations" },
  ...SEED_STORES.map((s) => ({ value: s.slug, label: s.name })),
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - dateOnly.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays >= 2 && diffDays <= 6) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const CHECKLIST_STORAGE_KEY = "primeos_inspection_checklist";
const CHECKLIST_COMPLETED_KEY = "primeos_checklist_completed";

export default function InspectionRadarPage() {
  const [selectedStore, setSelectedStore] = useState<"kent" | "aurora" | "lindseys" | "all">("kent");
  const [activeTab, setActiveTab] = useState<"radar" | "history" | "checklist">("radar");
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [checklistLastCompleted, setChecklistLastCompleted] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, boolean>;
        if (parsed && typeof parsed === "object") setCheckedItems(parsed);
      }
      const completed = localStorage.getItem(CHECKLIST_COMPLETED_KEY);
      if (completed) setChecklistLastCompleted(completed);
    } catch {
      // ignore
    }
  }, []);

  const nearbyInspections = useMemo(() => {
    if (selectedStore === "all") {
      return [...NEARBY_INSPECTIONS_KENT, ...NEARBY_INSPECTIONS_AURORA, ...NEARBY_INSPECTIONS_LINDSEYS].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
    if (selectedStore === "kent") return [...NEARBY_INSPECTIONS_KENT].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (selectedStore === "aurora") return [...NEARBY_INSPECTIONS_AURORA].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return [...NEARBY_INSPECTIONS_LINDSEYS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedStore]);

  const threat = useMemo(() => calculateThreat(nearbyInspections), [nearbyInspections]);

  const ownFiltered = useMemo(() => {
    if (selectedStore === "all") return [...OWN_INSPECTIONS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return OWN_INSPECTIONS.filter((i) => i.storeId === selectedStore).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedStore]);

  const lastInspection = useMemo(() => ownFiltered[0] ?? null, [ownFiltered]);

  const totalCount = useMemo(() => CHECKLIST.reduce((acc, cat) => acc + cat.items.length, 0), []);
  const completedCount = useMemo(() => {
    let n = 0;
    CHECKLIST.forEach((cat) => cat.items.forEach((item) => { if (checkedItems[item.id]) n++; }));
    return n;
  }, [checkedItems]);

  const toggleCheck = (itemId: string) => {
    const next = { ...checkedItems, [itemId]: !checkedItems[itemId] };
    setCheckedItems(next);
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      const total = CHECKLIST.reduce((acc, cat) => acc + cat.items.length, 0);
      const completed = Object.values(next).filter(Boolean).length;
      if (completed === total) {
        const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        setChecklistLastCompleted(dateStr);
        localStorage.setItem(CHECKLIST_COMPLETED_KEY, dateStr);
      }
    } catch {
      // ignore
    }
  };

  const resetChecklist = () => {
    setCheckedItems({});
    setChecklistLastCompleted(null);
    try {
      localStorage.removeItem(CHECKLIST_STORAGE_KEY);
      localStorage.removeItem(CHECKLIST_COMPLETED_KEY);
    } catch {
      // ignore
    }
  };

  function getTrend(current: OwnInspection, index: number, list: OwnInspection[]): "improving" | "steady" | "watching" {
    if (index >= list.length - 1) return "steady";
    const prev = list[index + 1];
    if (current.criticalViolations < prev.criticalViolations) return "improving";
    if (current.criticalViolations > prev.criticalViolations) return "watching";
    return "steady";
  }

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Health Inspection Radar
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Inspector activity near your locations</p>
        </div>
        <EducationInfoIcon metricKey="inspection_radar" />
      </div>

      {/* Store Selector */}
      <div className="flex flex-wrap gap-2">
        {STORE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelectedStore(opt.value as "kent" | "aurora" | "lindseys" | "all")}
            className={`px-3 py-2 rounded-lg text-xs font-medium min-h-[44px] touch-manipulation transition-colors ${
              selectedStore === opt.value ? "bg-[#E65100]/20 border border-[#E65100]/40 text-[#E65100]" : "bg-slate-800 border border-slate-700 text-slate-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Threat Level Hero */}
      <div
        className={`rounded-2xl border p-5 mb-4 ${
          threat.level === "imminent"
            ? "bg-red-600/20 border-red-500/40"
            : threat.level === "high"
              ? "bg-red-600/15 border-red-700/30"
              : threat.level === "elevated"
                ? "bg-amber-600/15 border-amber-700/30"
                : "bg-emerald-600/10 border-emerald-700/20"
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <EducationInfoIcon metricKey="risk_score" size="sm" />
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              threat.level === "imminent" ? "bg-red-600/30" : threat.level === "high" ? "bg-red-600/20" : threat.level === "elevated" ? "bg-amber-600/20" : "bg-emerald-600/20"
            }`}
          >
            {threat.level === "imminent" || threat.level === "high" ? (
              <ShieldAlert className={`w-6 h-6 ${threat.level === "imminent" ? "text-red-400 animate-pulse" : "text-red-400"}`} />
            ) : threat.level === "elevated" ? (
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div>
            <p
              className={`text-sm font-bold uppercase tracking-wide ${
                threat.level === "imminent" ? "text-red-400" : threat.level === "high" ? "text-red-400" : threat.level === "elevated" ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {threat.level}
            </p>
            <p className="text-xs text-slate-400">{threat.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{threat.inspectionsThisWeek}</p>
            <p className="text-[10px] text-slate-500">This Week</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-400">{threat.fourWeekAverage}</p>
            <p className="text-[10px] text-slate-500">4-Wk Avg</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">
              {threat.nearestDistance < 99 ? `${threat.nearestDistance.toFixed(1)} mi` : "—"}
            </p>
            <p className="text-[10px] text-slate-500">Nearest</p>
          </div>
        </div>
      </div>

      {/* Operator's Last Inspection Card */}
      {lastInspection && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Your Last Inspection</p>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                lastInspection.criticalViolations === 0 ? "bg-emerald-600/20" : "bg-amber-600/20"
              }`}
            >
              <span
                className={`text-lg font-bold ${lastInspection.criticalViolations === 0 ? "text-emerald-400" : "text-amber-400"}`}
              >
                {lastInspection.criticalViolations}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {lastInspection.criticalViolations === 0
                  ? "No critical violations"
                  : `${lastInspection.criticalViolations} critical violation${lastInspection.criticalViolations > 1 ? "s" : ""}`}
              </p>
              <p className="text-[10px] text-slate-500">
                {new Date(lastInspection.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {lastInspection.nonCriticalViolations} non-critical · {lastInspection.inspector}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-[10px] text-slate-500 mb-1.5">Most common critical violations for pizza restaurants in Ohio:</p>
            {COMMON_PIZZA_VIOLATIONS.slice(0, 3).map((v, i) => (
              <p key={i} className="text-[10px] text-slate-600 flex items-start gap-1.5 mb-0.5">
                <Circle className="w-2 h-2 text-slate-700 mt-1 flex-shrink-0" />
                {v}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-800 rounded-lg p-1">
        {[
          { id: "radar" as const, label: "Nearby Activity" },
          { id: "history" as const, label: "Your History" },
          { id: "checklist" as const, label: "Pre-Inspection" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors min-h-[44px] touch-manipulation ${
              activeTab === tab.id ? "bg-slate-700 text-white" : "text-slate-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RADAR TAB */}
      {activeTab === "radar" && (
        <>
          {nearbyInspections.map((item) => {
            const isExpanded = expandedInspection === item.id;
            return (
              <div key={item.id} className="bg-slate-800 rounded-xl border border-slate-700 mb-2 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedInspection(isExpanded ? null : item.id)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item.criticalViolations > 0 ? "bg-red-600/20" : "bg-emerald-600/15"
                        }`}
                      >
                        <span className={`text-xs font-bold ${item.criticalViolations > 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {item.criticalViolations}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{item.establishment}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.distance < 1 ? `${item.distance.toFixed(1)} mi` : `${item.distance.toFixed(1)} mi`} away · {formatDate(item.date)}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-slate-700 pt-2">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-600">Address:</span> <span className="text-slate-400">{item.address}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Type:</span> <span className="text-slate-400">{item.type}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Critical:</span>{" "}
                        <span className={item.criticalViolations > 0 ? "text-red-400" : "text-emerald-400"}>{item.criticalViolations}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Non-Critical:</span> <span className="text-slate-400">{item.nonCriticalViolations}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">County:</span> <span className="text-slate-400">{item.county}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Based on publicly posted inspection records from Portage County Health District and Stark County Health Department. Updated daily. Actual inspector activity may be higher — not all inspections post immediately.
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <a
                href="https://inspections.myhealthdepartment.com/portage-ohio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-400 underline flex items-center gap-0.5"
              >
                Portage County <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href="https://www.healthspace.com/Clients/Ohio/Stark/Web.nsf/food-frameset"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-400 underline flex items-center gap-0.5"
              >
                Stark County <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <>
          {ownFiltered.map((insp, index) => {
            const isExpanded = expandedInspection === insp.id;
            const trend = getTrend(insp, index, ownFiltered);
            return (
              <div key={insp.id} className="bg-slate-800 rounded-xl border border-slate-700 mb-2 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedInspection(isExpanded ? null : insp.id)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          insp.criticalViolations > 0 ? "bg-amber-600/20" : "bg-emerald-600/15"
                        }`}
                      >
                        <span className={`text-xs font-bold ${insp.criticalViolations > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {insp.criticalViolations}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white">
                          {new Date(insp.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {selectedStore === "all" && ` · ${insp.store}`}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {insp.criticalViolations} critical, {insp.nonCriticalViolations} non-critical
                          {trend === "improving" && " · Improving"}
                          {trend === "watching" && " · Worth watching"}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-slate-700 pt-2 space-y-2">
                    <p className="text-[10px] text-slate-500">
                      Type: {insp.type} · {insp.inspector} · {insp.county}
                    </p>
                    {insp.correctedOnSite > 0 && (
                      <p className="text-[10px] text-emerald-500">{insp.correctedOnSite} corrected on site</p>
                    )}
                    {insp.details.length > 0 && (
                      <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5">
                        {insp.details.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
            <p className="text-[10px] text-slate-500">
              Inspection records are public. PrimeOS pulls your history from the same county databases available to anyone — including your customers.
            </p>
          </div>
        </>
      )}

      {/* CHECKLIST TAB */}
      {activeTab === "checklist" && (
        <>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4 text-center">
            <p className="text-2xl font-bold text-white">
              {completedCount} / {totalCount}
            </p>
            <p className="text-xs text-slate-400">items checked</p>
            {completedCount === totalCount && (
              <div className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 inline-block">
                <p className="text-xs text-emerald-400 font-medium">✓ Checklist complete</p>
              </div>
            )}
            {checklistLastCompleted && <p className="text-[10px] text-slate-600 mt-2">Last completed: {checklistLastCompleted}</p>}
          </div>

          {CHECKLIST.map((cat) => {
            const checkedInCategory = cat.items.filter((item) => checkedItems[item.id]).length;
            const isExpanded = expandedCategory === cat.id;
            return (
              <div key={cat.id} className="mb-2">
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                  className="w-full bg-slate-800 rounded-xl border border-slate-700 p-3 flex items-center justify-between min-h-[44px] touch-manipulation"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-xs font-medium text-white">{cat.title}</span>
                    <span className="text-[10px] text-slate-600">
                      {checkedInCategory}/{cat.items.length}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                {isExpanded && (
                  <div className="bg-slate-800/50 border border-slate-700 border-t-0 rounded-b-xl px-3 pb-3">
                    {cat.items.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-3 py-2 border-b border-slate-700/50 last:border-0 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checkedItems[item.id] ?? false}
                          onChange={() => toggleCheck(item.id)}
                          className="mt-0.5 w-4 h-4 accent-[#E65100] flex-shrink-0"
                        />
                        <div className="flex-1">
                          <p className={`text-xs ${checkedItems[item.id] ? "text-slate-600 line-through" : "text-slate-300"}`}>{item.text}</p>
                          {item.critical && <span className="text-[9px] text-red-400 font-medium">CRITICAL ITEM</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={resetChecklist}
            className="w-full py-3 mt-4 rounded-xl border border-slate-700 text-xs text-slate-500 min-h-[44px] touch-manipulation"
          >
            Reset Checklist
          </button>
        </>
      )}
    </div>
  );
}
