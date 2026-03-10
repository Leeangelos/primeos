export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const FACILITIES_SEARCH_URL =
  "https://inspections.myhealthdepartment.com/portage-ohio/facilities/search?name=pizza&limit=10";

const MAX_BODY_CHARS = 10000;

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
    url: FACILITIES_SEARCH_URL,
    render_js: "true",
    wait: "5000",
  });
  const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?${params.toString()}`;
  const res = await fetch(scrapingBeeUrl, { cache: "no-store" });
  const body = await res.text();
  const bodyPreview = body.slice(0, MAX_BODY_CHARS);

  return NextResponse.json({
    status: res.status,
    responseLength: body.length,
    body: bodyPreview,
  });
}
