import { getAccessToken } from "@/lib/token";
import { sessionCookies } from "@/shared/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Json = {
  success?: boolean;
  message?: string;
  data?: unknown;
  error?: { code?: string; message?: string };
};

/**
 * Credentialed API fetch with Bearer access token + one silent refresh on 401.
 */
export async function apiFetch<T = Json>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<{ res: Response; json: T & Json }> {
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

  let json = {} as T & Json;
  try {
    json = (await res.json()) as T & Json;
  } catch {
    // non-json
  }

  if (res.status === 401 && !retried) {
    try {
      const storedRefresh = sessionCookies.getRefreshToken();
      const refreshRes = await fetch(`${API_URL}/api/identity/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storedRefresh ? { refreshToken: storedRefresh } : {}),
      });
      const refreshJson = (await refreshRes.json()) as {
        success?: boolean;
        data?: { account?: unknown; accessToken?: string; refreshToken?: string };
      };
      if (refreshRes.ok && refreshJson.data?.accessToken) {
        sessionCookies.saveTokens(
          refreshJson.data.accessToken,
          refreshJson.data.refreshToken || storedRefresh || undefined,
        );
        return apiFetch<T>(path, options, true);
      }
    } catch {
      // fall through
    }
  }

  return { res, json };
}
