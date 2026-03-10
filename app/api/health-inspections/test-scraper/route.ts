export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const TARGET_URL = "https://inspections.myhealthdepartment.com/portage-ohio";

export async function GET() {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SCRAPINGBEE_API_KEY is not set" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    url: TARGET_URL,
    render_js: "true",
  });
  const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?${params.toString()}`;

  const res = await fetch(scrapingBeeUrl, { cache: "no-store" });
  const body = await res.text();
  const preview = body.slice(0, 500);

  return NextResponse.json({
    status: res.status,
    responseLength: body.length,
    preview,
  });
}
