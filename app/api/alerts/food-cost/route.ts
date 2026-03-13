import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/lib/twilio";

export const dynamic = "force-dynamic";

const FOOD_COST_THRESHOLD = 32;
const ANGELO_PHONE = "+13302818433";
const GREG_PHONE = "+13302122762";
const LEEANELOS_SLUGS = ["kent", "aurora"];

function getFromNumber(store_slug: string): string | null {
  if (LEEANELOS_SLUGS.includes(store_slug)) {
    return process.env.TWILIO_LEEANELOS_NUMBER ?? null;
  }
  if (store_slug === "lindseys") {
    return process.env.TWILIO_LINDSEYS_NUMBER ?? null;
  }
  return process.env.TWILIO_LEEANELOS_NUMBER ?? null;
}

/**
 * POST /api/alerts/food-cost
 * Body: { store_slug, food_cost_pct, store_name }
 * If food_cost_pct > 32, sends SMS to Angelo and Greg.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const store_slug = typeof body.store_slug === "string" ? body.store_slug.trim() : "";
    const food_cost_pct = typeof body.food_cost_pct === "number" ? body.food_cost_pct : Number(body.food_cost_pct);
    const store_name = typeof body.store_name === "string" ? body.store_name.trim() : store_slug || "Store";

    if (!store_slug) {
      return NextResponse.json({ ok: false, error: "Missing store_slug" }, { status: 400 });
    }

    if (food_cost_pct <= FOOD_COST_THRESHOLD) {
      return NextResponse.json({
        ok: true,
        sent: false,
        reason: "below threshold",
      });
    }

    const fromNumber = getFromNumber(store_slug);
    if (!fromNumber) {
      return NextResponse.json({
        ok: true,
        sent: false,
        reason: "missing from number for store",
      });
    }

    const pctStr = Number.isFinite(food_cost_pct) ? food_cost_pct.toFixed(1) : String(food_cost_pct);
    const message = `PrimeOS Alert: ${store_name} food cost hit ${pctStr}% today vs 32% target. Review invoices and portion control.`;

    await sendSMS(ANGELO_PHONE, fromNumber, message);
    await sendSMS(GREG_PHONE, fromNumber, message);

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    console.error("[alerts/food-cost]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
