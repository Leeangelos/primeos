import { NextResponse } from "next/server";
import { fetchFoodTecView, formatFoodTecDate } from "@/src/lib/foodtec";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);

    const startDay = formatFoodTecDate(start);
    const endDay = formatFoodTecDate(today);

    // FoodTec topping view for a date range; exact range format depends on the view configuration.
    // Here we pass a simple pipe-delimited range as with other multi-day views if supported.
    const dayParam = `${startDay}|${endDay}`;

    const rows = await fetchFoodTecView("topping", dayParam);

    console.log("FoodTec topping test rows count:", rows.length);

    const sample = rows.slice(0, 3);
    console.log("FoodTec topping test sample:", sample);

    return NextResponse.json({
      dayParam,
      totalRows: rows.length,
      sample,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("FoodTec topping test error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

