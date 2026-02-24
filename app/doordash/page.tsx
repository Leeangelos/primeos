"use client";

import { useState, useMemo } from "react";
import { formatPct, formatDollars } from "@/src/lib/formatters";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";

type PlatformMonthlyData = {
  grossRevenue: number;
  commissionPct: number;
  commissionDollars: number;
  netRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  avgNetPerOrder: number;
  prevGrossRevenue: number;
  prevCommissionDollars: number;
  prevOrderCount: number;
};

type DeliveryPlatform = {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  isActive: boolean;
  monthlyData: PlatformMonthlyData;
};

const DELIVERY_PLATFORMS: DeliveryPlatform[] = [
  {
    id: "doordash",
    name: "DoorDash",
    icon: "🚗",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-700/30",
    isActive: true,
    monthlyData: {
      grossRevenue: 5480,
      commissionPct: 25.2,
      commissionDollars: 1381,
      netRevenue: 4099,
      orderCount: 312,
      avgOrderValue: 17.56,
      avgNetPerOrder: 13.14,
      prevGrossRevenue: 4920,
      prevCommissionDollars: 1230,
      prevOrderCount: 280,
    },
  },
  {
    id: "ubereats",
    name: "UberEats",
    icon: "🍔",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-700/30",
    isActive: true,
    monthlyData: {
      grossRevenue: 2840,
      commissionPct: 30.0,
      commissionDollars: 852,
      netRevenue: 1988,
      orderCount: 148,
      avgOrderValue: 19.19,
      avgNetPerOrder: 13.43,
      prevGrossRevenue: 2560,
      prevCommissionDollars: 768,
      prevOrderCount: 132,
    },
  },
  {
    id: "slice",
    name: "Slice",
    icon: "🍕",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-700/30",
    isActive: false,
    monthlyData: {
      grossRevenue: 1200,
      commissionPct: 7.9,
      commissionDollars: 95,
      netRevenue: 1105,
      orderCount: 68,
      avgOrderValue: 17.65,
      avgNetPerOrder: 16.25,
      prevGrossRevenue: 980,
      prevCommissionDollars: 77,
      prevOrderCount: 54,
    },
  },
  {
    id: "direct",
    name: "Direct Online",
    icon: "🌐",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-700/30",
    isActive: false,
    monthlyData: {
      grossRevenue: 3200,
      commissionPct: 3.5,
      commissionDollars: 112,
      netRevenue: 3088,
      orderCount: 185,
      avgOrderValue: 17.3,
      avgNetPerOrder: 16.69,
      prevGrossRevenue: 2800,
      prevCommissionDollars: 98,
      prevOrderCount: 160,
    },
  },
];

const COMPARISON_ROWS: { label: string; key: keyof PlatformMonthlyData; format: "dollar" | "pct" | "dollar2" | "number"; lowerIsBetter: boolean }[] = [
  { label: "Gross Revenue", key: "grossRevenue", format: "dollar", lowerIsBetter: false },
  { label: "Commission $", key: "commissionDollars", format: "dollar", lowerIsBetter: true },
  { label: "Commission %", key: "commissionPct", format: "pct", lowerIsBetter: true },
  { label: "Net Revenue", key: "netRevenue", format: "dollar", lowerIsBetter: false },
  { label: "Orders", key: "orderCount", format: "number", lowerIsBetter: false },
  { label: "Avg Order", key: "avgOrderValue", format: "dollar2", lowerIsBetter: false },
  { label: "Net/Order", key: "avgNetPerOrder", format: "dollar2", lowerIsBetter: false },
];

export default function DeliveryEconomicsPage() {
  const [activePlatforms, setActivePlatforms] = useState<string[]>(() =>
    DELIVERY_PLATFORMS.filter((p) => p.isActive).map((p) => p.id)
  );

  const togglePlatform = (id: string) => {
    setActivePlatforms((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((p) => p !== id);
      }
      return [...prev, id];
    });
  };

  const activePlatformData = useMemo(
    () => DELIVERY_PLATFORMS.filter((p) => activePlatforms.includes(p.id)),
    [activePlatforms]
  );

  const lowestCommissionPlatform = useMemo(() => {
    if (activePlatformData.length === 0) return null;
    return activePlatformData.reduce((a, b) =>
      a.monthlyData.commissionPct <= b.monthlyData.commissionPct ? a : b
    );
  }, [activePlatformData]);

  const highestNetPlatform = useMemo(() => {
    if (activePlatformData.length === 0) return null;
    return activePlatformData.reduce((a, b) =>
      a.monthlyData.avgNetPerOrder >= b.monthlyData.avgNetPerOrder ? a : b
    );
  }, [activePlatformData]);

  const mostOrdersPlatform = useMemo(() => {
    if (activePlatformData.length === 0) return null;
    return activePlatformData.reduce((a, b) =>
      a.monthlyData.orderCount >= b.monthlyData.orderCount ? a : b
    );
  }, [activePlatformData]);

  const lowestNetPlatform = useMemo(() => {
    if (activePlatformData.length === 0) return null;
    return activePlatformData.reduce((a, b) =>
      a.monthlyData.avgNetPerOrder <= b.monthlyData.avgNetPerOrder ? a : b
    );
  }, [activePlatformData]);

  const formatCell = (val: number, format: string) => {
    if (format === "dollar") return formatDollars(val);
    if (format === "pct") return formatPct(val);
    if (format === "dollar2") return "$" + val.toFixed(2);
    return String(val);
  };

  const getBestValue = (key: keyof PlatformMonthlyData, lowerIsBetter: boolean) => {
    if (activePlatformData.length === 0) return null;
    const values = activePlatformData.map((p) => p.monthlyData[key] as number);
    return lowerIsBetter ? Math.min(...values) : Math.max(...values);
  };

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Delivery Economics</h1>
          <p className="text-xs text-slate-400 mt-0.5">Platform costs, commissions, and net revenue per order</p>
        </div>
        <EducationInfoIcon metricKey="delivery_economics" />
      </div>

      <div className="mb-4">
        <h3 className="text-xs text-slate-500 mb-2">Active Platforms</h3>
        <div className="flex flex-wrap gap-2">
          {DELIVERY_PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlatform(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                activePlatforms.includes(p.id)
                  ? `${p.bgColor} ${p.borderColor} ${p.color}`
                  : "bg-slate-800 border-slate-700 text-slate-500"
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {activePlatformData.map((p) => {
        const d = p.monthlyData;
        return (
          <div key={p.id} className={`bg-slate-800 rounded-xl border ${p.borderColor} p-4 mb-3`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{p.icon}</span>
              <h3 className={`text-sm font-semibold ${p.color}`}>{p.name}</h3>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <div className="text-xs text-slate-500">Gross Revenue</div>
                <div className="text-sm text-emerald-400 font-medium">{formatDollars(d.grossRevenue)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Commission</div>
                <div className="text-sm text-red-400 font-medium">{formatDollars(d.commissionDollars)}</div>
                <div className="text-[10px] text-slate-600">{formatPct(d.commissionPct)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Net Revenue</div>
                <div className="text-sm text-emerald-400 font-medium">{formatDollars(d.netRevenue)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-slate-500">Orders</div>
                <div className="text-sm text-white font-medium">{d.orderCount}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Avg Order</div>
                <div className="text-sm text-white font-medium">${d.avgOrderValue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Net/Order</div>
                <div className="text-sm text-white font-medium">${d.avgNetPerOrder.toFixed(2)}</div>
              </div>
            </div>
          </div>
        );
      })}

      {activePlatformData.length >= 2 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-white">Platform Comparison</h3>
            <EducationInfoIcon metricKey="net_revenue_per_order" size="sm" />
          </div>

          <div className="space-y-2 mb-4">
            {lowestCommissionPlatform && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/10 border border-emerald-700/30">
                <span className="text-xs text-emerald-400">💰 Lowest Commission:</span>
                <span className="text-xs text-white font-medium">
                  {lowestCommissionPlatform.name} at {formatPct(lowestCommissionPlatform.monthlyData.commissionPct)}
                </span>
              </div>
            )}
            {highestNetPlatform && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/10 border border-emerald-700/30">
                <span className="text-xs text-emerald-400">🎯 Highest Net/Order:</span>
                <span className="text-xs text-white font-medium">
                  {highestNetPlatform.name} at ${highestNetPlatform.monthlyData.avgNetPerOrder.toFixed(2)}
                </span>
              </div>
            )}
            {mostOrdersPlatform && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-700/30">
                <span className="text-xs text-blue-400">📦 Most Orders:</span>
                <span className="text-xs text-white font-medium">
                  {mostOrdersPlatform.name} with {mostOrdersPlatform.monthlyData.orderCount} orders
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-500 py-2 pr-2">Metric</th>
                  {activePlatformData.map((p) => (
                    <th key={p.id} className={`text-right py-2 px-1 ${p.color}`}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => {
                  const bestVal = getBestValue(row.key, row.lowerIsBetter);
                  return (
                    <tr key={row.key} className="border-b border-slate-700/50">
                      <td className="text-slate-400 py-2 pr-2">{row.label}</td>
                      {activePlatformData.map((p) => {
                        const val = p.monthlyData[row.key] as number;
                        const isBest = bestVal != null && val === bestVal;
                        return (
                          <td
                            key={p.id}
                            className={`text-right py-2 px-1 ${isBest ? "text-emerald-400 font-medium" : "text-slate-300"}`}
                          >
                            {formatCell(val, row.format)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {activePlatformData.length >= 2 && highestNetPlatform && lowestNetPlatform && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-slate-700/50">
              <p className="text-xs text-slate-300">
                {mostOrdersPlatform?.name} brings the most orders, but {highestNetPlatform.name} nets you $
                {(highestNetPlatform.monthlyData.avgNetPerOrder - lowestNetPlatform.monthlyData.avgNetPerOrder).toFixed(
                  2
                )}{" "}
                more per order after fees.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
