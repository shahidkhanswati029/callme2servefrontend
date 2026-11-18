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

export const portfolioApi = {
  mine() {
    return request<{
      success: boolean;
      data: {
        certificates: Array<{
          id: string;
          title: string;
          issuer: string | null;
          fileUrl: string;
          verified: boolean;
        }>;
        portfolioItems: Array<{
          id: string;
          title: string;
          mediaUrl: string;
          kind: string;
        }>;
        readyToBid: boolean;
      };
    }>("/api/portfolio/me");
  },
  addCertificate(body: { title: string; issuer?: string; fileUrl: string }) {
    return request("/api/portfolio/certificates", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  removeCertificate(id: string) {
    return request(`/api/portfolio/certificates/${id}`, { method: "DELETE" });
  },
  addItem(body: { title: string; mediaUrl: string; kind?: string }) {
    return request("/api/portfolio/items", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  removeItem(id: string) {
    return request(`/api/portfolio/items/${id}`, { method: "DELETE" });
  },
};
