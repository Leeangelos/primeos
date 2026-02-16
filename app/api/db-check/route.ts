import { NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

/**
 * GET /api/db-check — Infrastructure validation only.
 * Confirms Supabase connectivity. No schema, no persistence.
 */
export async function GET() {
  try {
    await getClientForRoute();
    return NextResponse.json({ connected: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { connected: false, error: message },
      { status: 502 }
    );
  }
}
