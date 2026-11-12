import type { AuthResponse, PublicAccount } from "./types";
import { getAccessToken } from "@/lib/token";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  code: string;
  constructor(message: string, code = "REQUEST_FAILED") {
    super(message);
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let json: {
    success?: boolean;
    message?: string;
    data?: unknown;
    error?: { code?: string; message?: string };
  } = {};
  try {
    json = await res.json();
  } catch {
    throw new ApiError("Server returned an invalid response");
  }

  if (!res.ok || json.success === false) {
    throw new ApiError(
      json.error?.message || json.message || "Request failed",
      json.error?.code || "REQUEST_FAILED",
    );
  }
  return json as T;
}

function authHeader(accessToken?: string | null): HeadersInit {
  // null/undefined both fall back to the stored access token
  const token = accessToken || getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const identityApi = {
  refresh(refreshToken?: string | null) {
    return request<AuthResponse>("/api/identity/refresh", {
      method: "POST",
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });
  },

  google(idToken: string) {
    return request<AuthResponse>("/api/identity/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  },

  facebook(accessToken: string) {
    return request<AuthResponse>("/api/identity/facebook", {
      method: "POST",
      body: JSON.stringify({ accessToken }),
    });
  },

  async me(accessToken?: string | null): Promise<PublicAccount> {
    const json = await request<{
      success: boolean;
      data: { account: PublicAccount };
    }>("/api/identity/me", {
      headers: authHeader(accessToken),
    });
    return json.data.account;
  },

  logout(accessToken?: string | null) {
    return request<{ success: boolean; message?: string }>("/api/identity/logout", {
      method: "POST",
      headers: authHeader(accessToken),
    });
  },

  saveDetails(
    accessToken: string | null | undefined,
    body: {
      work: string;
      languages: string[];
      city: string;
      phone?: string;
      placeLabel?: string;
    },
  ) {
    return request<{ success: boolean; message?: string; data: { account: PublicAccount } }>(
      "/api/identity/details",
      {
        method: "PATCH",
        headers: authHeader(accessToken),
        body: JSON.stringify(body),
      },
    );
  },

  savePhoto(photoUrl: string) {
    return request<{ success: boolean; message?: string; data: { account: PublicAccount } }>(
      "/api/identity/photo",
      {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ photoUrl }),
      },
    );
  },

  webauthnRegisterOptions(accessToken?: string | null) {
    return request<{ success: boolean; data: { options: Record<string, unknown> } }>(
      "/api/identity/webauthn/register/options",
      {
        method: "POST",
        headers: authHeader(accessToken),
      },
    );
  },

  webauthnRegisterVerify(
    accessToken: string | null | undefined,
    attestationResponse: unknown,
    deviceHint: "fingerprint" | "face",
  ) {
    return request<{
      success: boolean;
      message?: string;
      data: { account: PublicAccount };
    }>("/api/identity/webauthn/register/verify", {
      method: "POST",
      headers: authHeader(accessToken),
      body: JSON.stringify({ attestationResponse, deviceHint }),
    });
  },

  webauthnLoginOptions() {
    return request<{
      success: boolean;
      data: { options: Record<string, unknown> };
    }>("/api/identity/webauthn/login/options", {
      method: "POST",
    });
  },

  webauthnLoginVerify(assertionResponse: unknown) {
    return request<AuthResponse>("/api/identity/webauthn/login/verify", {
      method: "POST",
      body: JSON.stringify({ assertionResponse }),
    });
  },

  deskLogin(email: string) {
    return request<AuthResponse>("/api/identity/desk/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  patchLanguage(
    uiLanguage: "en" | "ur" | "pa" | "ar" | "fa" | "ja",
    languages?: string[],
  ) {
    return request<{
      success: boolean;
      data: { account: PublicAccount };
    }>("/api/language", {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({ uiLanguage, ...(languages ? { languages } : {}) }),
    });
  },

  patchPrefs(body: {
    uiLanguage?: "en" | "ur" | "pa" | "ar" | "fa" | "ja";
    country?: string;
    currency?: string;
    languages?: string[];
  }) {
    return request<{
      success: boolean;
      data: { account: PublicAccount };
    }>("/api/language", {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify(body),
    });
  },
};
