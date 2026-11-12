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

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  data?: Record<string, unknown> | null;
  actor?: { id: string; name: string; photoUrl: string | null } | null;
};

export const notificationsApi = {
  list(page = 1, pageSize = 20) {
    return request<{
      success: boolean;
      data: {
        notifications: AppNotification[];
        total: number;
        page: number;
        pageSize: number;
        unread: number;
      };
    }>(`/api/notifications?page=${page}&pageSize=${pageSize}`);
  },
  markRead(id: string) {
    return request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: "POST" });
  },
  markAllRead() {
    return request<{ success: boolean }>("/api/notifications/read-all", { method: "POST" });
  },
  savePushToken(token: string, language = "en") {
    return request<{ success: boolean }>("/api/notifications/push-token", {
      method: "POST",
      body: JSON.stringify({ token, language }),
    });
  },
};
