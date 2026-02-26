import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "5000";
  const type = searchParams.get("type") || "restaurant";
  const keyword = searchParams.get("keyword") || "pizza";

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }
  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&keyword=${keyword}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Places API error:", data.status, data.error_message);
      return NextResponse.json({ error: data.status, message: data.error_message }, { status: 500 });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const competitors = (data.results || []).map((place: { place_id: string; name: string; vicinity: string; geometry?: { location?: { lat: number; lng: number } }; rating?: number; user_ratings_total?: number; price_level?: number; opening_hours?: { open_now?: boolean }; types?: string[] }) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      rating: place.rating ?? null,
      reviewCount: place.user_ratings_total ?? 0,
      priceLevel: place.price_level ?? null,
      isOpen: place.opening_hours?.open_now ?? null,
      types: place.types || [],
      distance: calculateDistance(latNum, lngNum, place.geometry?.location?.lat ?? 0, place.geometry?.location?.lng ?? 0),
    }));
    competitors.sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance);

    return NextResponse.json({
      competitors,
      count: competitors.length,
      searchCenter: { lat: latNum, lng: lngNum },
      radius: parseInt(radius, 10),
    });
  } catch (error) {
    console.error("Places API fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch nearby places" }, { status: 500 });
  }
}
