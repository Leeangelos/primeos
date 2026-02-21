import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - diff);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function getPeriodToDate(date: Date): { start: string; end: string } {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  return {
    start: `${y}-${String(m + 1).padStart(2, "0")}-01`,
    end: date.toISOString().slice(0, 10),
  };
}

function getYearToDate(date: Date): { start: string; end: string } {
  return {
    start: `${date.getUTCFullYear()}-01-01`,
    end: date.toISOString().slice(0, 10),
  };
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store");

  const now = new Date();
  const thisWeek = getWeekRange(now);
  
  const lastWeekDate = new Date(now);
  lastWeekDate.setUTCDate(now.getUTCDate() - 7);
  const lastWeek = getWeekRange(lastWeekDate);

  const lastYearDate = new Date(now);
  lastYearDate.setUTCFullYear(now.getUTCFullYear() - 1);
  const lastYear = getWeekRange(lastYearDate);

  const ptd = getPeriodToDate(now);
  const lastYearPtdEnd = new Date(now);
  lastYearPtdEnd.setUTCFullYear(now.getUTCFullYear() - 1);
  const lastYearPtd = getPeriodToDate(lastYearPtdEnd);

  const ytd = getYearToDate(now);
  const lastYearYtd = {
    start: `${now.getUTCFullYear() - 1}-01-01`,
    end: lastYearPtdEnd.toISOString().slice(0, 10),
  };

  async function fetchRange(start: string, end: string, storeSlug?: string | null) {
    let query = supabase
      .from("daily_kpis")
      .select("business_date, net_sales, store_id, stores!inner(slug, name)")
      .gte("business_date", start)
      .lte("business_date", end)
      .order("business_date", { ascending: true });

    if (storeSlug && storeSlug !== "all") {
      query = query.eq("stores.slug", storeSlug);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }

  // Fetch all ranges
  const [twData, lwData, lyData, ptdData, lyPtdData, ytdData, lyYtdData] = await Promise.all([
    fetchRange(thisWeek.start, thisWeek.end, store),
    fetchRange(lastWeek.start, lastWeek.end, store),
    fetchRange(lastYear.start, lastYear.end, store),
    fetchRange(ptd.start, ptd.end, store),
    fetchRange(lastYearPtd.start, lastYearPtd.end, store),
    fetchRange(ytd.start, ytd.end, store),
    fetchRange(lastYearYtd.start, lastYearYtd.end, store),
  ]);

  function sumSales(data: any[]): number {
    return data.reduce((sum, d) => sum + (d.net_sales ?? 0), 0);
  }

  function salesByDayOfWeek(data: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const d of data) {
      const date = new Date(d.business_date + "T12:00:00Z");
      const dayIdx = date.getUTCDay();
      const dayName = DAYS[dayIdx === 0 ? 6 : dayIdx - 1];
      result[dayName] = (result[dayName] || 0) + (d.net_sales ?? 0);
    }
    return result;
  }

  const twByDay = salesByDayOfWeek(twData);
  const lwByDay = salesByDayOfWeek(lwData);
  const lyByDay = salesByDayOfWeek(lyData);

  const twTotal = sumSales(twData);
  const lwTotal = sumSales(lwData);
  const lyTotal = sumSales(lyData);

  const dailyComparison = DAYS.map((day) => {
    const tw = twByDay[day] || 0;
    const lw = lwByDay[day] || 0;
    const ly = lyByDay[day] || 0;
    return {
      day,
      thisWeek: Math.round(tw),
      lastWeek: Math.round(lw),
      lastWeekPct: lw > 0 ? +(((tw - lw) / lw) * 100).toFixed(0) : null,
      lastYear: Math.round(ly),
      lastYearPct: ly > 0 ? +(((tw - ly) / ly) * 100).toFixed(0) : null,
    };
  });

  const ptdTotal = sumSales(ptdData);
  const lyPtdTotal = sumSales(lyPtdData);
  const ytdTotal = sumSales(ytdData);
  const lyYtdTotal = sumSales(lyYtdData);

  return NextResponse.json({
    ok: true,
    weekOf: thisWeek.start,
    daily: dailyComparison,
    totals: {
      thisWeek: Math.round(twTotal),
      lastWeek: Math.round(lwTotal),
      lastWeekPct: lwTotal > 0 ? +(((twTotal - lwTotal) / lwTotal) * 100).toFixed(0) : null,
      lastYear: Math.round(lyTotal),
      lastYearPct: lyTotal > 0 ? +(((twTotal - lyTotal) / lyTotal) * 100).toFixed(0) : null,
    },
    periodToDate: {
      thisYear: Math.round(ptdTotal),
      lastYear: Math.round(lyPtdTotal),
      changePct: lyPtdTotal > 0 ? +(((ptdTotal - lyPtdTotal) / lyPtdTotal) * 100).toFixed(0) : null,
    },
    yearToDate: {
      thisYear: Math.round(ytdTotal),
      lastYear: Math.round(lyYtdTotal),
      changePct: lyYtdTotal > 0 ? +(((ytdTotal - lyYtdTotal) / lyYtdTotal) * 100).toFixed(0) : null,
    },
  });
}
