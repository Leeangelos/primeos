export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const PORTAGE_URL = "https://inspections.myhealthdepartment.com/portage-ohio";
const FACILITIES_URL = "https://inspections.myhealthdepartment.com/portage-ohio/facilities";

export async function GET() {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SCRAPINGBEE_API_KEY is not set" },
      { status: 500 }
    );
  }

  async function fetchViaScrapingBee(targetUrl: string) {
    const params = new URLSearchParams({
      api_key: apiKey!,
      url: targetUrl,
      render_js: "true",
      wait: "5000",
    });
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?${params.toString()}`;
    const res = await fetch(scrapingBeeUrl, { cache: "no-store" });
    const body = await res.text();
    return {
      status: res.status,
      responseLength: body.length,
      preview: body.slice(0, 1000),
    };
  }

  const [portage, facilities] = await Promise.all([
    fetchViaScrapingBee(PORTAGE_URL),
    fetchViaScrapingBee(FACILITIES_URL),
  ]);

  return NextResponse.json({
    portage,
    facilities,
  });
}
