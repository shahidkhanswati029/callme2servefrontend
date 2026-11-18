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
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    const json = {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "We can’t reach the server. Check your connection and try again.",
      },
    } as T & Json;
    return {
      res: new Response(null, { status: 503, statusText: "Network Error" }),
      json,
    };
  }

  let json = {} as T & Json;
  try {
    json = (await res.json()) as T & Json;
  } catch {
    if (res.status >= 500) {
      json = {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "The server hit a problem. Please try again in a moment.",
        },
      } as T & Json;
    }
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
