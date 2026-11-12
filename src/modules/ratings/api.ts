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

export const ratingsApi = {
  get(expertId: string) {
    return request<{
      success: boolean;
      data: {
        expert: { id: string; name: string; rating: number; ratingCount: number };
        mine: { stars: number; text: string | null; updatedAt: string } | null;
      };
    }>(`/api/ratings/${expertId}`);
  },
  save(body: { toAccountId: string; stars: number; text?: string; jobId?: string }) {
    return request<{
      success: boolean;
      message?: string;
      data: {
        account: { id: string; name: string; rating: number; ratingCount: number };
        mine: { stars: number; text: string | null };
      };
    }>("/api/ratings", { method: "POST", body: JSON.stringify(body) });
  },
};
