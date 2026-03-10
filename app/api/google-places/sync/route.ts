export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STORES = [
  {
    id: "7cd4cb61-7e90-44f5-8739-5f19074262b8",
    name: "Kent",
    searchName: "LeeAngelo's",
    city: "Kent",
    lat: 41.1534,
    lng: -81.3579,
  },
  {
    id: "906e5dfb-6199-4460-936d-fc1e783e4574",
    name: "Aurora",
    searchName: "LeeAngelo's",
    city: "Aurora",
    lat: 41.3145,
    lng: -81.3457,
  },
  {
    id: "3fb37b49-cfe7-4a9f-9940-a472b5def680",
    name: "Lindseys",
    searchName: "Lindsey's Pizza",
    city: "North Canton",
    lat: 40.837,
    lng: -81.4496,
  },
];

const BASE = "https://places.googleapis.com/v1";
const FIELDS_OWN =
  "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.location,places.googleMapsUri,places.nationalPhoneNumber";
const FIELDS_NEARBY =
  "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.location,places.googleMapsUri";

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isOwnBrand(displayName: string): boolean {
  const lower = displayName.toLowerCase();
  return lower.includes("leeangelo") || lower.includes("lindsey");
}

type Place = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  types?: string[];
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
};

export async function POST() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const errors: string[] = [];
  const results: Record<
    string,
    { own: boolean; competitors: number }
  > = {
    kent: { own: false, competitors: 0 },
    aurora: { own: false, competitors: 0 },
    lindseys: { own: false, competitors: 0 },
  };

  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY is not set", results, errors },
      { status: 500 }
    );
  }
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase env not set", results, errors },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const headers: Record<string, string> = {
    "X-Goog-Api-Key": apiKey,
    "Content-Type": "application/json",
  };

  for (const store of STORES) {
    const key =
      store.name.toLowerCase() === "lindseys"
        ? "lindseys"
        : store.name.toLowerCase();

    try {
      // CALL 1 — Own store (Text Search)
      const textRes = await fetch(`${BASE}/places:searchText`, {
        method: "POST",
        headers: {
          ...headers,
          "X-Goog-FieldMask": FIELDS_OWN,
        },
        body: JSON.stringify({
          textQuery: `${store.searchName} ${store.city} OH`,
          locationBias: {
            circle: {
              center: { latitude: store.lat, longitude: store.lng },
              radius: 1000.0,
            },
          },
        }),
      });

      if (!textRes.ok) {
        errors.push(`${store.name} textSearch: ${textRes.status}`);
        continue;
      }

      const textData = (await textRes.json()) as { places?: Place[] };
      const places = textData.places ?? [];
      const first = places[0];

      if (first?.id) {
        const name = first.displayName?.text ?? "";
        const row = {
          store_id: store.id,
          is_own_store: true,
          google_place_id: first.id,
          name,
          address: first.formattedAddress ?? null,
          distance_miles: 0,
          google_rating: first.rating ?? null,
          google_review_count: first.userRatingCount ?? null,
          price_level: first.priceLevel ?? null,
          categories: Array.isArray(first.types) ? first.types : [],
          google_maps_url: first.googleMapsUri ?? null,
          phone: first.nationalPhoneNumber ?? null,
          latitude: first.location?.latitude ?? null,
          longitude: first.location?.longitude ?? null,
          last_synced_at: new Date().toISOString(),
        };
        const { error: upsertErr } = await supabase
          .from("store_competitor_profiles")
          .upsert(row, {
            onConflict: "store_id,google_place_id",
            ignoreDuplicates: false,
          });
        if (!upsertErr) results[key].own = true;
        if (upsertErr) errors.push(`${store.name} own upsert: ${upsertErr.message}`);
      }

      // CALL 2 — Competitors (Nearby Search)
      const nearbyRes = await fetch(`${BASE}/places:searchNearby`, {
        method: "POST",
        headers: {
          ...headers,
          "X-Goog-FieldMask": FIELDS_NEARBY,
        },
        body: JSON.stringify({
          includedTypes: ["restaurant", "pizza_restaurant"],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude: store.lat, longitude: store.lng },
              radius: 8047.0,
            },
          },
        }),
      });

      if (!nearbyRes.ok) {
        errors.push(`${store.name} nearby: ${nearbyRes.status}`);
        continue;
      }

      const nearbyData = (await nearbyRes.json()) as { places?: Place[] };
      const nearbyPlaces = nearbyData.places ?? [];
      let competitorCount = 0;

      for (const p of nearbyPlaces) {
        const name = p.displayName?.text ?? "";
        if (isOwnBrand(name)) continue;
        if (!p.id) continue;

        const lat = p.location?.latitude;
        const lng = p.location?.longitude;
        const distance_miles =
          lat != null && lng != null
            ? haversineMiles(store.lat, store.lng, lat, lng)
            : null;

        const row = {
          store_id: store.id,
          is_own_store: false,
          google_place_id: p.id,
          name,
          address: p.formattedAddress ?? null,
          distance_miles,
          google_rating: p.rating ?? null,
          google_review_count: p.userRatingCount ?? null,
          price_level: p.priceLevel ?? null,
          categories: Array.isArray(p.types) ? p.types : [],
          google_maps_url: p.googleMapsUri ?? null,
          phone: null,
          latitude: lat ?? null,
          longitude: lng ?? null,
          last_synced_at: new Date().toISOString(),
        };

        const { error: upsertErr } = await supabase
          .from("store_competitor_profiles")
          .upsert(row, {
            onConflict: "store_id,google_place_id",
            ignoreDuplicates: false,
          });
        if (!upsertErr) competitorCount += 1;
      }
      results[key].competitors = competitorCount;
    } catch (e) {
      errors.push(`${store.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ results, errors });
}
