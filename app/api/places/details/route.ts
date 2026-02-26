import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const fields =
      "name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,price_level,reviews,geometry,url";
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = (await response.json()) as {
      status: string;
      result?: {
        name?: string;
        formatted_address?: string;
        formatted_phone_number?: string;
        website?: string;
        url?: string;
        rating?: number;
        user_ratings_total?: number;
        price_level?: number;
        opening_hours?: { weekday_text?: string[]; open_now?: boolean };
        geometry?: { location?: { lat: number; lng: number } };
        reviews?: Array<{
          author_name: string;
          rating: number;
          text: string;
          relative_time_description: string;
          profile_photo_url?: string;
        }>;
      };
    };

    if (data.status !== "OK") {
      return NextResponse.json({ error: data.status }, { status: 500 });
    }

    const place = data.result!;
    return NextResponse.json({
      placeId,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number ?? null,
      website: place.website ?? null,
      googleMapsUrl: place.url ?? null,
      rating: place.rating ?? null,
      reviewCount: place.user_ratings_total ?? 0,
      priceLevel: place.price_level ?? null,
      hours: place.opening_hours?.weekday_text ?? [],
      isOpen: place.opening_hours?.open_now ?? null,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      reviews: (place.reviews || []).map((r) => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.relative_time_description,
        profilePhoto: r.profile_photo_url,
      })),
    });
  } catch (error) {
    console.error("Place details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
