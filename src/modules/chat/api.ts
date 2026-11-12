import { ApiError } from "@/modules/identity/api";
import { apiFetch } from "@/lib/apiFetch";
import { getAccessToken } from "@/lib/token";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { res, json } = await apiFetch<T>(path, options);
  if (!res.ok || (json as { success?: boolean }).success === false) {
    const err = json as { error?: { message?: string }; message?: string };
    throw new ApiError(err.error?.message || err.message || "Request failed");
  }
  return json as T;
}

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  kind: "TEXT" | "IMAGE" | "VIDEO" | "VOICE";
  body: string | null;
  mediaUrl: string | null;
  mediaDurationS: number | null;
  createdAt: string;
  readAt?: string | null;
  deletedAt?: string | null;
  deleted?: boolean;
};

export const chatApi = {
  list() {
    return request<{
      success: boolean;
      data: {
        conversations: Array<{
          id: string;
          other: {
            id: string;
            name: string;
            work: string | null;
            placeLabel: string | null;
            isOnline: boolean;
            photoUrl: string | null;
            lastSeenAt?: string | null;
          };
          lastMessage: ChatMessage | null;
          lastMessageAt: string;
        }>;
      };
    }>("/api/chat/conversations");
  },
  open(otherId: string) {
    return request<{
      success: boolean;
      data: {
        conversation: { id: string };
        messages: ChatMessage[];
        other: {
          id: string;
          name: string;
          photoUrl: string | null;
          work: string | null;
          placeLabel: string | null;
          isOnline: boolean;
          lastSeenAt: string | null;
          rating: number;
          ratingCount: number;
        };
      };
    }>(`/api/chat/conversations/${otherId}`, { method: "POST" });
  },
  markRead(conversationId: string) {
    return request<{
      success: boolean;
      data: { conversationId: string; messageIds: string[]; readAt: string };
    }>(`/api/chat/conversations/${conversationId}/read`, { method: "POST" });
  },
  send(body: {
    conversationId?: string;
    toAccountId?: string;
    kind?: string;
    body?: string;
    mediaUrl?: string;
    mediaDurationS?: number;
  }) {
    return request<{
      success: boolean;
      message?: string;
      data: { message: ChatMessage; conversationId: string };
    }>("/api/chat/messages", { method: "POST", body: JSON.stringify(body) });
  },
  delete(messageId: string, scope: "everyone" | "me" = "everyone") {
    return request<{
      success: boolean;
      message?: string;
      data: { message: ChatMessage; conversationId: string; scope: "everyone" | "me" };
    }>(`/api/chat/messages/${messageId}?scope=${scope}`, {
      method: "DELETE",
      body: JSON.stringify({ scope }),
    });
  },
};

function readVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const done = (value?: number) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () => {
      const d = video.duration;
      // Some browsers report Infinity until enough data — treat as unknown, let server decide.
      if (!Number.isFinite(d) || d <= 0) {
        done(undefined);
        return;
      }
      done(d);
    };
    video.onerror = () => done(undefined);
    // Timeout so a stuck metadata read never blocks upload forever.
    window.setTimeout(() => done(undefined), 8000);
    video.src = url;
  });
}

function looksLikeVideo(file: File, kindHint?: string) {
  if (kindHint === "VIDEO") return true;
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|webm|mov|m4v|avi|mkv|mpeg|mpg|3gp)$/i.test(file.name);
}

export async function uploadMedia(file: File, kindHint?: "IMAGE" | "VIDEO" | "VOICE") {
  const token = getAccessToken();
  const fd = new FormData();
  fd.append("file", file);
  if (kindHint) fd.append("kind", kindHint);

  let durationS: number | undefined;
  if (looksLikeVideo(file, kindHint)) {
    durationS = await readVideoDuration(file);
    if (typeof durationS === "number" && Number.isFinite(durationS) && durationS > 30.05) {
      throw new ApiError("Video stops at 30 seconds", "VIDEO_CAP");
    }
    if (typeof durationS === "number" && Number.isFinite(durationS) && durationS > 0) {
      fd.append("durationS", String(durationS));
    }
  }

  const res = await fetch(`${API_URL}/api/media/upload`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new ApiError(json.error?.message || json.message || "Upload failed");
  }
  return {
    ...(json.data as { url: string; durationS?: number; kind?: string }),
    durationS: json.data?.durationS ?? durationS,
  };
}
