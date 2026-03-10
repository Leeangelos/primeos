export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const API_INSPECTIONS =
  "https://inspections.myhealthdepartment.com/portage-ohio/api/v1/inspections?limit=10";
const API_FACILITIES =
  "https://inspections.myhealthdepartment.com/portage-ohio/api/v1/facilities?limit=10";
const API_FACILITIES_SEARCH =
  "https://inspections.myhealthdepartment.com/portage-ohio/api/v1/facilities/search?name=pizza&limit=10";

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
      wait: "3000",
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

  const [inspections, facilities, facilitiesSearch] = await Promise.all([
    fetchViaScrapingBee(API_INSPECTIONS),
    fetchViaScrapingBee(API_FACILITIES),
    fetchViaScrapingBee(API_FACILITIES_SEARCH),
  ]);

  return NextResponse.json({
    inspections,
    facilities,
    facilitiesSearch,
  });
}
