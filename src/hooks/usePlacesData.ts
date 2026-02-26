"use client";

import { useState, useEffect, useCallback } from "react";
import { STORE_LOCATIONS, getStoreLocation } from "@/src/lib/store-locations";

export interface Competitor {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number;
  priceLevel: number | null;
  isOpen: boolean | null;
  types: string[];
  distance: number;
}

export interface StoreProfile {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number;
  reviews: { author: string; rating: number; text: string; time: string }[];
  phone: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  hours: string[];
  isOpen: boolean | null;
}

export interface PlacesData {
  competitors: Competitor[];
  storeProfile: StoreProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePlacesData(storeId: string): PlacesData {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const store = getStoreLocation(storeId);
    if (!store) return;

    setLoading(true);
    setError(null);

    try {
      const nearbyRes = await fetch(
        `/api/places/nearby?lat=${store.lat}&lng=${store.lng}&radius=8000&keyword=pizza`
      );
      if (nearbyRes.ok) {
        const nearbyData = await nearbyRes.json();
        const filtered = (nearbyData.competitors || []).filter(
          (c: Competitor) => {
            const nameLower = c.name.toLowerCase();
            if (nameLower.includes("leeangelo") || nameLower.includes("lindsey's pizza")) return false;
            return true;
          }
        );
        setCompetitors(filtered);
      }

      const findRes = await fetch(
        `/api/places/find-store?query=${encodeURIComponent(store.name + " " + store.address + " " + store.city + " OH")}&lat=${store.lat}&lng=${store.lng}`
      );
      if (findRes.ok) {
        const findData = await findRes.json();
        if (findData.candidates && findData.candidates.length > 0) {
          const ourPlaceId = findData.candidates[0].placeId;
          const detailRes = await fetch(`/api/places/details?placeId=${ourPlaceId}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            setStoreProfile(detailData);
          }
        }
      }
    } catch (err) {
      console.error("Places data error:", err);
      setError("Unable to load live data. Showing cached data.");
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { competitors, storeProfile, loading, error, refresh: fetchData };
}

export function useAllStoreProfiles(): {
  profiles: Record<string, StoreProfile | null>;
  loading: boolean;
} {
  const [profiles, setProfiles] = useState<Record<string, StoreProfile | null>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const results: Record<string, StoreProfile | null> = {};
      for (const store of STORE_LOCATIONS) {
        try {
          const findRes = await fetch(
            `/api/places/find-store?query=${encodeURIComponent(store.name + " " + store.address + " " + store.city + " OH")}&lat=${store.lat}&lng=${store.lng}`
          );
          if (findRes.ok) {
            const findData = await findRes.json();
            if (findData.candidates?.[0]?.placeId) {
              const detailRes = await fetch(`/api/places/details?placeId=${findData.candidates[0].placeId}`);
              if (detailRes.ok) {
                results[store.id] = await detailRes.json();
                continue;
              }
            }
          }
          results[store.id] = null;
        } catch {
          results[store.id] = null;
        }
      }
      setProfiles(results);
      setLoading(false);
    }
    fetchAll();
  }, []);

  return { profiles, loading };
}
