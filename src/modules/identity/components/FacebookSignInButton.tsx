"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { identityApi } from "../api";
import { useAppDispatch } from "@/store/hooks";
import { setSession } from "@/store/slices/sessionSlice";
import { useToast } from "@/shared/toast/ToastProvider";

declare global {
  interface Window {
    FB?: {
      init: (opts: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        cb: (response: {
          authResponse?: { accessToken: string };
          status: string;
        }) => void,
        opts: { scope: string; return_scopes?: boolean },
      ) => void;
      getLoginStatus: (
        cb: (response: {
          status: string;
          authResponse?: { accessToken: string };
        }) => void,
        fresh?: boolean,
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function domainSetupHint() {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://your-frontend-domain";
  const host =
    typeof window !== "undefined" ? window.location.hostname : "your-frontend-domain";
  return (
    `Facebook blocked this site. In Meta Developer → your app: ` +
    `Settings → Basic → App Domains add "${host}"; ` +
    `Add platform Website with Site URL "${origin}/"; ` +
    `Facebook Login → Settings → Valid OAuth Redirect URIs add "${origin}/" and "${origin}/login"; ` +
    `App Mode Live (or add your Facebook account as Tester).`
  );
}

const ACCOUNT_UNAVAILABLE =
  "Facebook sign-in is unavailable for this account right now. " +
  "If the app is in Development mode, add this Facebook user under Roles → Testers, " +
  "or switch the app to Live, then try again.";

const FB_SCOPE = "public_profile,email";

function isMobileBrowser() {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    navigator.userAgent,
  );
}

function readHashAccessToken() {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw.includes("access_token=")) return null;
  const params = new URLSearchParams(raw);
  return params.get("access_token");
}

function readOAuthError() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  const search = window.location.search.replace(/^\?/, "");
  const params = new URLSearchParams(hash || search);
  const err = params.get("error") || params.get("error_code");
  const desc = params.get("error_description") || params.get("error_message");
  if (!err && !desc) return null;
  return { err: err || "", desc: desc || "" };
}

function clearOAuthFragment() {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, "", window.location.pathname + window.location.search);
}

export function FacebookSignInButton({
  label = "Continue with Facebook",
}: {
  label?: string;
}) {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mobile, setMobile] = useState(false);
  const finishing = useRef(false);

  useEffect(() => {
    setMobile(isMobileBrowser());
  }, []);

  async function finishWithToken(accessToken: string) {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    try {
      const res = await identityApi.facebook(accessToken);
      if (!res.data) throw new Error("Facebook sign-in failed");
      dispatch(
        setSession({
          account: res.data.account,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        }),
      );
      toast.success(res.message || "Facebook sign-in successful");
      const a = res.data.account;
      if (!a.city?.trim() || !a.placeLabel?.trim()) router.replace("/onboarding/details");
      else router.replace("/home");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Facebook failed";
      if (/not found|unavailable|not configured|503|FACEBOOK_NOT/i.test(msg)) {
        toast.error(ACCOUNT_UNAVAILABLE);
      } else if (/facebook|domain|origin|app.?id|blocked/i.test(msg)) {
        toast.error(`${msg}. ${domainSetupHint()}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
      finishing.current = false;
    }
  }

  useEffect(() => {
    const oauthErr = readOAuthError();
    if (oauthErr) {
      clearOAuthFragment();
      const text = `${oauthErr.err} ${oauthErr.desc}`.toLowerCase();
      if (/access_denied|unavailable|not.?available|user.?denied|temporarily/i.test(text)) {
        toast.error(ACCOUNT_UNAVAILABLE);
      } else {
        toast.error(oauthErr.desc || ACCOUNT_UNAVAILABLE);
      }
      return;
    }
    const tokenFromRedirect = readHashAccessToken();
    if (tokenFromRedirect) {
      clearOAuthFragment();
      void finishWithToken(tokenFromRedirect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!appId) return;
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        cookie: true,
        xfbml: false,
        version: "v21.0",
      });
      setReady(true);
    };
    if (document.getElementById("facebook-jssdk")) {
      if (window.FB) {
        window.FB.init({
          appId,
          cookie: true,
          xfbml: false,
          version: "v21.0",
        });
        setReady(true);
      }
      return;
    }
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      toast.error("Could not load Facebook SDK. Check network / ad blockers.");
    };
    document.body.appendChild(script);
  }, [appId, toast]);

  function startMobileRedirect() {
    if (!appId) return;
    const redirectUri = `${window.location.origin}/login`;
    // Do NOT use auth_type=rerequest — that forces Facebook email/password again.
    // Returning users with an active Facebook session continue automatically.
    const url =
      `https://www.facebook.com/v21.0/dialog/oauth` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(FB_SCOPE)}` +
      `&response_type=token` +
      `&display=touch`;
    window.location.assign(url);
  }

  function runFbLoginPopup() {
    if (!window.FB) return;
    setBusy(true);
    window.FB.login(
      async (response) => {
        try {
          if (!response.authResponse?.accessToken) {
            if (response.status === "unknown" || response.status === "not_authorized") {
              toast.error(ACCOUNT_UNAVAILABLE);
            } else if (response.status === "connected") {
              toast.error(ACCOUNT_UNAVAILABLE);
            } else {
              toast.info("Facebook login was cancelled.");
            }
            return;
          }
          await finishWithToken(response.authResponse.accessToken);
        } finally {
          setBusy(false);
        }
      },
      { scope: FB_SCOPE, return_scopes: true },
    );
  }

  function onClick() {
    if (!appId) {
      toast.error("Set NEXT_PUBLIC_FACEBOOK_APP_ID in your host env (Vercel/Railway), then rebuild.");
      return;
    }

    // Prefer an existing Facebook session (same account, no password prompt).
    if (window.FB && ready) {
      setBusy(true);
      window.FB.getLoginStatus((statusRes) => {
        if (statusRes.status === "connected" && statusRes.authResponse?.accessToken) {
          void finishWithToken(statusRes.authResponse.accessToken).finally(() =>
            setBusy(false),
          );
          return;
        }
        // Mobile popups are unreliable — fall back to full-page OAuth (no rerequest).
        if (isMobileBrowser()) {
          startMobileRedirect();
          return;
        }
        setBusy(false);
        runFbLoginPopup();
      });
      return;
    }

    if (isMobileBrowser()) {
      setBusy(true);
      startMobileRedirect();
      return;
    }

    toast.info("Facebook SDK still loading — try again in a second.");
  }

  return (
    <button
      type="button"
      className="btn btn-facebook cursor-pointer"
      onClick={onClick}
      disabled={busy || (Boolean(appId) && !ready && !mobile)}
      title={!appId ? "Facebook App ID missing in env" : undefined}
    >
      <span className="f-mark">f</span>
      {busy ? "Connecting…" : label}
    </button>
  );
}
