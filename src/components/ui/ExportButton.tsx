"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface ExportButtonProps {
  pageName: string;
}

export function ExportButton({ pageName }: ExportButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [toast, setToast] = useState(false);

  const handleExport = (format: string) => {
    setShowOptions(false);
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  return (
    <div className="relative">
      <button onClick={() => setShowOptions(!showOptions)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-slate-300 transition-colors">
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
      </button>

      {showOptions && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowOptions(false)} />
          <div className="absolute top-full right-0 mt-1 z-40 bg-slate-800 rounded-lg border border-slate-700 shadow-lg shadow-black/30 overflow-hidden">
            <button onClick={() => handleExport("csv")} className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-700/50 transition-colors">
              Export CSV
            </button>
            <button onClick={() => handleExport("pdf")} className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-700/50 border-t border-slate-700 transition-colors">
              Export PDF
            </button>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 shadow-lg shadow-black/30 animate-slide-up">
          <p className="text-xs text-slate-300">{pageName} export coming soon</p>
        </div>
      )}
    </div>
  );
}
