import { ApiError } from "@/modules/identity/api";
import { getAccessToken } from "@/lib/token";
import type { PublicAccount } from "@/modules/identity/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new ApiError(json.error?.message || json.message || "Request failed");
  }
  return json as T;
}

export type Shop = {
  id: string;
  ownerId: string;
  type: string;
  name: string;
  typeFields: Record<string, string>;
  street: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  doorPhotoUrl: string | null;
  status: "HELD" | "LIVE";
  heldReason: string | null;
};

export const shopsApi = {
  mine() {
    return request<{ success: boolean; data: { shops: Shop[] } }>("/api/shops/mine");
  },
  create(body: {
    type: string;
    name: string;
    typeFields: Record<string, string>;
    street?: string;
  }) {
    return request<{ success: boolean; message?: string; data: { shop: Shop } }>(
      "/api/shops",
      { method: "POST", body: JSON.stringify(body) },
    );
  },
  savePin(shopId: string, body: { latitude: number; longitude: number; accuracyM?: number }) {
    return request<{ success: boolean; message?: string; data: { shop: Shop } }>(
      `/api/shops/${shopId}/pin`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
  },
  setDoorPhoto(shopId: string, doorPhotoUrl: string) {
    return request<{ success: boolean; message?: string; data: { shop: Shop } }>(
      `/api/shops/${shopId}/door-photo`,
      { method: "PATCH", body: JSON.stringify({ doorPhotoUrl }) },
    );
  },
  nearby(km = 5) {
    return request<{
      success: boolean;
      data: { shops: (Shop & { ownerName: string; distanceKm: number })[]; km: number };
    }>(`/api/shops/nearby?km=${km}`);
  },
};

export type { PublicAccount };
