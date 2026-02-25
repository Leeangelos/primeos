"use client";

import { useState } from "react";
import { Download } from "lucide-react";

function escapeCsvCell(s: string): string {
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export interface ExportData {
  headers: string[];
  rows: string[][];
}

interface ExportButtonProps {
  pageName: string;
  getData?: () => ExportData;
}

export function ExportButton({ pageName, getData }: ExportButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleExport = (format: string) => {
    setShowOptions(false);
    if (format !== "csv") return;
    if (getData) {
      const { headers, rows } = getData();
      const escapedHeaders = headers.map(escapeCsvCell);
      const escapedRows = rows.map((r) => r.map(escapeCsvCell).join(","));
      const csvContent = [escapedHeaders.join(","), ...escapedRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pageName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      setToast("Export data not available for this page");
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-slate-300 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
      </button>

      {showOptions && (
        <>
          <div className="fixed inset-0 z-30" aria-hidden onClick={() => setShowOptions(false)} />
          <div className="absolute top-full right-0 mt-1 z-40 bg-slate-800 rounded-lg border border-slate-700 shadow-lg shadow-black/30 overflow-hidden">
            <button
              type="button"
              onClick={() => handleExport("csv")}
              className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-700/50 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 shadow-lg shadow-black/30 animate-slide-up">
          <p className="text-xs text-slate-300">{toast}</p>
        </div>
      )}
    </div>
  );
}
