"use client";

interface DataDisclaimerProps {
  confidence: "high" | "medium" | "low" | "no-data";
  details?: string;
}

export function DataDisclaimer({ confidence, details }: DataDisclaimerProps) {
  const configs = {
    high: { color: "bg-emerald-400", label: "High", desc: "Based on 6+ months of consistent data." },
    medium: { color: "bg-amber-400", label: "Medium", desc: "Based on partial data. Import more months for higher accuracy." },
    low: { color: "bg-red-400", label: "Low", desc: "Limited data available. Results are estimates only." },
    "no-data": { color: "bg-slate-500", label: "No Data", desc: "No data imported yet. Upload invoices and sales mix to begin." },
  };
  const cfg = configs[confidence];

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-3 mt-4">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
        <span className="text-xs text-slate-400 font-medium">Data Confidence: {cfg.label}</span>
      </div>
      <p className="text-xs text-slate-500">{details || cfg.desc}</p>
      <p className="text-xs text-slate-600 mt-1">Calculations are based on your imported data. Verify against your actual financial records.</p>
    </div>
  );
}
