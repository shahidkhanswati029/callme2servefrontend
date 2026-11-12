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
  nearby(km = 5, filters?: { category?: string; q?: string }) {
    const params = new URLSearchParams({ km: String(km) });
    if (filters?.category) params.set("category", filters.category);
    if (filters?.q) params.set("q", filters.q);
    return request<{
      success: boolean;
      data: { experts: NearbyExpert[]; km: number };
    }>(`/api/location/nearby?${params}`);
  },
};
