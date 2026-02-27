"use client";

import { useState, useCallback, useEffect } from "react";

const IFRAME_WIDTH = 375;

type RouteStatus = "demo" | "phase2" | "hidden";

type RouteConfig = {
  path: string;
  label: string;
  status: RouteStatus;
};

const ROUTES: RouteConfig[] = [
  { path: "/", label: "Home", status: "demo" },
  { path: "/daily", label: "Daily KPI", status: "demo" },
  { path: "/weekly", label: "Weekly Snapshot", status: "demo" },
  { path: "/monthly", label: "Monthly P&L", status: "demo" },
  { path: "/brief", label: "Morning Brief", status: "demo" },
  { path: "/pnl", label: "GP P&L", status: "demo" },
  { path: "/rolodex", label: "Trusted Rolodex", status: "demo" },
  { path: "/recipes", label: "Recipes", status: "demo" },
  { path: "/invoices", label: "Invoice Scanner", status: "demo" },
  { path: "/sales", label: "Sales Report", status: "demo" },
  { path: "/inventory", label: "Inventory", status: "demo" },
  { path: "/people", label: "People Economics", status: "demo" },
  { path: "/marketing", label: "Ad Accountability", status: "demo" },
  { path: "/parties", label: "Catering & Large Orders", status: "demo" },
  { path: "/schedule", label: "Smart Schedule", status: "demo" },
  { path: "/billing", label: "Our Story", status: "demo" },
  { path: "/doordash", label: "DoorDash Economics", status: "demo" },
  { path: "/merch", label: "Team Merch", status: "demo" },
  { path: "/tasks", label: "Manager Tasks", status: "demo" },
  { path: "/chat", label: "Team Chat", status: "demo" },
  { path: "/actual-pnl", label: "Actual P&L", status: "phase2" },
  { path: "/hiring", label: "Hiring", status: "phase2" },
  { path: "/training", label: "Training", status: "phase2" },
  { path: "/local-intel", label: "Local Intel", status: "phase2" },
];

export type AuditResult = {
  path: string;
  label: string;
  status: RouteStatus;
  loaded: boolean;
  hasContent: boolean;
  hasEducationIcon: boolean;
  noOverflowX: boolean;
  bottomNavVisible: boolean;
  error?: string;
};

function runAudit(iframe: HTMLIFrameElement): Omit<AuditResult, "path" | "label" | "status"> {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  const result: Omit<AuditResult, "path" | "label" | "status"> = {
    loaded: false,
    hasContent: false,
    hasEducationIcon: false,
    noOverflowX: true,
    bottomNavVisible: false,
  };

  if (!doc || !win) {
    result.error = "Cannot access iframe (same-origin required)";
    return result;
  }

  try {
    result.loaded = true;
    const body = doc.body;
    const html = doc.documentElement;

    // White screen / no content: body exists but very little content
    const textLength = (body?.innerText ?? "").trim().length;
    const main = doc.querySelector("main");
    const hasMainContent = main && main.children.length > 0 && (main.innerText ?? "").trim().length > 20;
    result.hasContent = textLength > 50 || !!hasMainContent;

    // At least one EducationInfoIcon (data-testid from InfoIcon component)
    result.hasEducationIcon = !!doc.querySelector('[data-testid="education-info-icon"]');

    // No horizontal overflow at 375px viewport
    const scrollWidth = html.scrollWidth;
    result.noOverflowX = scrollWidth <= IFRAME_WIDTH + 2; // small tolerance

    // Bottom nav visible (nav with aria-label "Bottom navigation")
    const bottomNav = doc.querySelector('nav[aria-label="Bottom navigation"]');
    result.bottomNavVisible = !!bottomNav && bottomNav.children.length > 0;
  } catch (e) {
    result.error = e instanceof Error ? e.message : "Check failed";
  }

  return result;
}

function AuditRow({
  config,
  result,
  index,
  onIframeLoad,
}: {
  config: RouteConfig;
  result: AuditResult | null;
  index: number;
  onIframeLoad: (path: string, label: string, status: RouteStatus, iframe: HTMLIFrameElement) => void;
}) {
  const isDemo = config.status === "demo";
  const pass =
    result &&
    result.loaded &&
    result.hasContent &&
    result.hasEducationIcon &&
    result.noOverflowX &&
    result.bottomNavVisible &&
    !result.error;

  return (
    <div className="border-b border-slate-700 py-3">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-mono text-sm text-slate-300">{config.path}</span>
        <span className="text-xs text-slate-500">{config.label}</span>
        {config.status === "phase2" && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
            Phase 2 — Not in Demo
          </span>
        )}
        {config.status === "hidden" && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-600/50 text-slate-400 border border-slate-500/40">
            Hidden for Demo
          </span>
        )}
        {isDemo && result && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
              pass ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"
            }`}
          >
            {pass ? "PASS" : "FAIL"}
          </span>
        )}
      </div>
      {isDemo && result && (
        <ul className="text-[10px] text-slate-500 space-y-0.5 ml-2">
          <li>Loads: {result.loaded ? "✓" : "✗"}</li>
          <li>Has content: {result.hasContent ? "✓" : "✗"}</li>
          <li>EducationInfoIcon: {result.hasEducationIcon ? "✓" : "✗"}</li>
          <li>No overflow-x: {result.noOverflowX ? "✓" : "✗"}</li>
          <li>Bottom nav visible: {result.bottomNavVisible ? "✓" : "✗"}</li>
          {result.error && <li className="text-red-400">Error: {result.error}</li>}
        </ul>
      )}
      {isDemo && (
        <div className="mt-2" style={{ width: IFRAME_WIDTH }}>
          <iframe
            data-audit-path={config.path}
            data-audit-index={String(index)}
            src={config.path}
            title={`Audit: ${config.label}`}
            width={IFRAME_WIDTH}
            height={280}
            className="border border-slate-600 rounded-lg bg-slate-900 block"
            onLoad={(e) => {
              const el = e.currentTarget;
              if (el) onIframeLoad(config.path, config.label, config.status, el);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function DevAuditPage() {
  const [results, setResults] = useState<Record<string, AuditResult>>({});
  const [reportPass, setReportPass] = useState<boolean | null>(null);

  const handleIframeLoad = useCallback(
    (path: string, label: string, status: RouteStatus, iframe: HTMLIFrameElement) => {
      if (status !== "demo") return;
      const audit = runAudit(iframe);
      setResults((prev) => ({
        ...prev,
        [path]: { path, label, status, ...audit },
      }));
    },
    []
  );

  useEffect(() => {
    const demoRoutes = ROUTES.filter((r) => r.status === "demo");
    const resultList = demoRoutes.map((r) => results[r.path]).filter(Boolean);
    if (resultList.length === 0) setReportPass(null);
    else if (resultList.length < demoRoutes.length) setReportPass(null);
    else {
      const allPass = resultList.every(
        (r) =>
          r!.loaded &&
          r!.hasContent &&
          r!.hasEducationIcon &&
          r!.noOverflowX &&
          r!.bottomNavVisible &&
          !r!.error
      );
      setReportPass(allPass);
    }
  }, [results]);

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto pb-28">
      <div>
        <h1 className="text-xl font-bold text-white">Dev Audit — 375px Checklist</h1>
        <p className="text-xs text-slate-500 mt-1">
          All built routes. Demo routes load in an iframe and are checked automatically on load.
        </p>
      </div>

      {/* Pass/Fail report */}
      {reportPass !== null && (
        <div
          className={`rounded-xl border p-4 ${
            reportPass ? "border-emerald-500/50 bg-emerald-500/10" : "border-red-500/50 bg-red-500/10"
          }`}
        >
          <div className={`text-lg font-bold ${reportPass ? "text-emerald-400" : "text-red-400"}`}>
            {reportPass ? "All demo routes passed" : "Some demo routes failed"}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {reportPass
              ? "Loads, content, EducationInfoIcon, no overflow-x, bottom nav visible."
              : "Review failed rows below."}
          </p>
        </div>
      )}

      {/* Route list with iframes */}
      <div className="space-y-0">
        {ROUTES.map((config, index) => (
          <AuditRow
            key={config.path}
            config={config}
            result={results[config.path] ?? null}
            index={index}
            onIframeLoad={handleIframeLoad}
          />
        ))}
      </div>

      <p className="text-[10px] text-slate-500 pb-8">
        Checks: (1) Page loads without errors, (2) Page has content, (3) At least one EducationInfoIcon, (4)
        No overflow-x at 375px, (5) Bottom nav visible. Phase 2 and Hidden routes are not iframe-tested.
      </p>
    </div>
  );
}
