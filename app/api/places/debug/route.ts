import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  // Check 1: Is the env variable set?
  const keyStatus = API_KEY
    ? `Set (starts with ${API_KEY.substring(0, 10)}..., length ${API_KEY.length})`
    : "NOT SET";

  // Check 2: Are there other similar env variables?
  const otherKeys = {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ? "SET" : "NOT SET",
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "SET" : "NOT SET",
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ? "SET" : "NOT SET",
  };

  // Check 3: Make a test call to Google and return the FULL response
  let googleResponse = null;
  let googleUrl = "";

  if (API_KEY) {
    try {
      googleUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent("LeeAngelo's Kent OH")}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total&key=${API_KEY}`;

      const res = await fetch(googleUrl);
      googleResponse = await res.json();
    } catch (error: unknown) {
      googleResponse = { fetchError: error instanceof Error ? error.message : String(error) };
    }
  }

  return NextResponse.json({
    envCheck: {
      GOOGLE_PLACES_API_KEY: keyStatus,
      otherKeys,
    },
    testCall: {
      url: googleUrl ? googleUrl.replace(API_KEY!, "KEY_REDACTED") : "No key, no call made",
      fullResponse: googleResponse,
    },
    timestamp: new Date().toISOString(),
  });
}
