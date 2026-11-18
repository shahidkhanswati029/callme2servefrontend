import { ApiError } from "@/modules/identity/api";
import { apiFetch } from "@/lib/apiFetch";
import type { PublicAccount } from "@/modules/identity/types";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { res, json } = await apiFetch<T>(path, options);
  if (!res.ok || (json as { success?: boolean }).success === false) {
    const err = json as { error?: { message?: string }; message?: string };
    throw new ApiError(err.error?.message || err.message || "Request failed");
  }
  return json as T;
}

export type NearbyExpert = {
  id: string;
  name: string;
  work: string | null;
  placeLabel: string | null;
  city: string | null;
  rating: number;
  ratingCount?: number;
  topRanked?: boolean;
  distanceKm: number;
  distanceM: number;
  distanceLabel?: string;
  latitude: number;
  longitude: number;
  package: string;
  isOnline?: boolean;
};

export const locationApi = {
  getMine() {
    return request<{
      success: boolean;
      data: { place: Record<string, unknown>; account: PublicAccount };
    }>("/api/location/me");
  },
  save(body: {
    placeLabel: string;
    city?: string;
    country?: string;
    currency?: string;
    latitude: number;
    longitude: number;
    accuracyM?: number;
    autoDetect?: boolean;
    language?: string;
  }) {
    return request<{
      success: boolean;
      message?: string;
      data: { account: PublicAccount; place: unknown };
    }>("/api/location/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  nearby(
    km?: number,
    filters?: {
      category?: string;
      q?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const params = new URLSearchParams();
    if (km != null) params.set("km", String(km));
    if (filters?.category) params.set("category", filters.category);
    if (filters?.q) params.set("q", filters.q);
    if (filters?.latitude != null) params.set("latitude", String(filters.latitude));
    if (filters?.longitude != null) params.set("longitude", String(filters.longitude));
    const qs = params.toString();
    return request<{
      success: boolean;
      data: {
        experts: NearbyExpert[];
        km: number;
        radiusKm?: number;
        package?: string;
        inquiries?: string;
        origin?: { latitude: number; longitude: number };
      };
    }>(`/api/location/nearby${qs ? `?${qs}` : ""}`);
  },
  detect(latitude: number, longitude: number, language?: string) {
    return request<{
      success: boolean;
      data: {
        latitude: number;
        longitude: number;
        country: string;
        city: string | null;
        placeLabel: string;
        postcode?: string | null;
        neighborhood?: string | null;
        currency: string;
        detected: boolean;
        language?: string;
      };
    }>("/api/location/detect", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude, language: language || "en" }),
    });
  },
};
