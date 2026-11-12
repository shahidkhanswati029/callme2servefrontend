import Cookies from "js-cookie";
import type { PublicAccount } from "@/modules/identity/types";

const ACCOUNT_KEY = "cmts_expert";
/** Tokens live in localStorage — NOT document.cookie — so Cookies panel stays clean. */
const ACCESS_KEY = "cmts_at";
const REFRESH_KEY = "cmts_rt";
const LEGACY_ACCESS = "cmts_access_client";
const LEGACY_REFRESH = "cmts_refresh_client";

const accountCookieOpts: Cookies.CookieAttributes = {
  sameSite: "lax",
  expires: 7,
  path: "/",
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
};

let memoryAccess: string | null = null;
let memoryRefresh: string | null = null;

function scrubLegacyCookieTokens() {
  if (typeof window === "undefined") return;
  Cookies.remove(LEGACY_ACCESS, { path: "/" });
  Cookies.remove(LEGACY_REFRESH, { path: "/" });
  // Never leave readable copies of API cookie names in document.cookie
  Cookies.remove("cmts_access", { path: "/" });
  Cookies.remove("cmts_refresh", { path: "/" });
}

function lsGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // ignore quota / private mode
  }
}

function readAccess(): string | null {
  if (memoryAccess) return memoryAccess;
  const v = lsGet(ACCESS_KEY);
  memoryAccess = v;
  return v;
}

function readRefresh(): string | null {
  if (memoryRefresh) return memoryRefresh;
  const v = lsGet(REFRESH_KEY);
  memoryRefresh = v;
  return v;
}

function writeAccess(token: string | null) {
  memoryAccess = token;
  lsSet(ACCESS_KEY, token);
}

function writeRefresh(token: string | null) {
  memoryRefresh = token;
  lsSet(REFRESH_KEY, token);
}

/**
 * Session persistence for cross-origin API (localhost:3000 → :4000).
 * Account cookie = UI only. Tokens = localStorage (survive refresh, not Cookies panel).
 */
export const sessionCookies = {
  saveSession(account: PublicAccount, accessToken?: string, refreshToken?: string) {
    Cookies.set(ACCOUNT_KEY, JSON.stringify(account), accountCookieOpts);
    if (accessToken) writeAccess(accessToken);
    if (refreshToken) writeRefresh(refreshToken);
    scrubLegacyCookieTokens();
  },

  saveAccount(account: PublicAccount) {
    Cookies.set(ACCOUNT_KEY, JSON.stringify(account), accountCookieOpts);
  },

  saveAccessToken(accessToken: string) {
    writeAccess(accessToken);
  },

  saveTokens(accessToken: string, refreshToken?: string) {
    writeAccess(accessToken);
    if (refreshToken) writeRefresh(refreshToken);
  },

  getAccount(): PublicAccount | null {
    const raw = Cookies.get(ACCOUNT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PublicAccount;
    } catch {
      return null;
    }
  },

  getAccessToken(): string | null {
    return readAccess();
  },

  getRefreshToken(): string | null {
    return readRefresh();
  },

  clear() {
    Cookies.remove(ACCOUNT_KEY, { path: "/" });
    writeAccess(null);
    writeRefresh(null);
    scrubLegacyCookieTokens();
  },
};
