import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!query) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address,rating,user_ratings_total,geometry,opening_hours,price_level&key=${API_KEY}`;
    if (lat && lng) {
      url += `&locationbias=point:${lat},${lng}`;
    }
    const response = await fetch(url);
    const data = (await response.json()) as {
      status: string;
      candidates?: Array<{
        place_id: string;
        name?: string;
        formatted_address?: string;
        rating?: number;
        user_ratings_total?: number;
        geometry?: { location?: { lat: number; lng: number } };
        opening_hours?: { open_now?: boolean };
        price_level?: number;
      }>;
    };

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json({ error: data.status }, { status: 500 });
    }

    const candidates = (data.candidates || []).map((place) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating ?? null,
      reviewCount: place.user_ratings_total ?? 0,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      isOpen: place.opening_hours?.open_now ?? null,
      priceLevel: place.price_level ?? null,
    }));

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("Find store error:", error);
    return NextResponse.json(
      { error: "Failed to find store" },
      { status: 500 }
    );
  }
}
