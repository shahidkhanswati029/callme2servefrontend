import { ApiError } from "@/modules/identity/api";
import { apiFetch } from "@/lib/apiFetch";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { res, json } = await apiFetch<T>(path, options);
  if (!res.ok || (json as { success?: boolean }).success === false) {
    const err = json as { error?: { message?: string }; message?: string };
    throw new ApiError(err.error?.message || err.message || "Request failed");
  }
  return json as T;
}

export type QuotationBid = {
  id: string;
  requestId: string;
  bidderId: string;
  message: string | null;
  priceAmount: number;
  currency: string;
  arriveInMinutes: number;
  finishInMinutes: number;
  distanceKm: number;
  status: string;
  createdAt: string;
  bidder?: {
    id: string;
    name: string;
    photoUrl: string | null;
    rating: number;
    ratingCount: number;
    package: string;
    work: string | null;
    city: string | null;
  };
};

export type QuotationRequest = {
  id: string;
  askerId: string;
  category: string;
  title: string | null;
  notes: string | null;
  videoUrl: string;
  videoDurationS: number;
  latitude: number;
  longitude: number;
  country: string;
  city: string | null;
  currency: string;
  status: string;
  createdAt: string;
  distanceKm?: number | null;
  myRadiusKm?: number | null;
  inquiries?: string;
  bids?: QuotationBid[];
  asker?: { id: string; name: string; photoUrl: string | null; rating: number; city: string | null };
  myBid?: { id: string; status: string } | null;
};

export const quotationsApi = {
  config() {
    return request<{ success: boolean; data: Record<string, unknown> }>("/api/quotations/config");
  },
  create(body: {
    category: string;
    title?: string;
    notes?: string;
    videoUrl: string;
    videoDurationS: number;
    latitude?: number;
    longitude?: number;
  }) {
    return request<{ success: boolean; data: { request: QuotationRequest; notified: number } }>(
      "/api/quotations",
      { method: "POST", body: JSON.stringify(body) },
    );
  },
  nearby() {
    return request<{ success: boolean; data: { quotations: QuotationRequest[] } }>(
      "/api/quotations/nearby",
    );
  },
  mine() {
    return request<{ success: boolean; data: { quotations: QuotationRequest[] } }>(
      "/api/quotations/mine",
    );
  },
  get(id: string) {
    return request<{ success: boolean; data: QuotationRequest }>(`/api/quotations/${id}`);
  },
  placeBid(
    id: string,
    body: {
      message?: string;
      priceAmount: number;
      arriveInMinutes: number;
      finishInMinutes: number;
    },
  ) {
    return request<{ success: boolean; data: { bid: QuotationBid } }>(
      `/api/quotations/${id}/bids`,
      { method: "POST", body: JSON.stringify(body) },
    );
  },
  accept(bidId: string) {
    return request<{ success: boolean; data: unknown }>(
      `/api/quotations/bids/${bidId}/accept`,
      { method: "POST" },
    );
  },
  reject(bidId: string) {
    return request<{ success: boolean; data: unknown }>(
      `/api/quotations/bids/${bidId}/reject`,
      { method: "POST" },
    );
  },
};
