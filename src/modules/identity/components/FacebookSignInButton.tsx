"use client";

import { useEffect, useState } from "react";
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
        opts: { scope: string },
      ) => void;
      getLoginStatus?: (cb: (response: { status: string }) => void) => void;
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
    `Facebook Login → Settings → Valid OAuth Redirect URIs add "${origin}/"; ` +
    `App Mode Live (or add your Facebook account as Tester). ` +
    `Use a stable Production domain (not a changing Vercel preview URL).`
  );
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
    script.onerror = () => {
      toast.error("Could not load Facebook SDK. Check network / ad blockers.");
    };
    document.body.appendChild(script);
  }, [appId, toast]);

  function onClick() {
    if (!appId) {
      toast.error("Set NEXT_PUBLIC_FACEBOOK_APP_ID in your host env (Vercel/Railway), then rebuild.");
      return;
    }
    if (!window.FB || !ready) {
      toast.info("Facebook SDK still loading — try again in a second.");
      return;
    }
    setBusy(true);
    window.FB.login(
      async (response) => {
        try {
          if (!response.authResponse?.accessToken) {
            if (response.status === "unknown" || response.status === "not_authorized") {
              toast.error(domainSetupHint());
            } else {
              toast.info("Facebook login cancelled");
            }
            return;
          }
          const res = await identityApi.facebook(response.authResponse.accessToken);
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
          if (!a.work || !a.city) router.push("/onboarding/details");
          else if (!a.hasWebAuthn) router.push("/onboarding/biometrics");
          else router.push("/home");
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Facebook failed";
          if (/facebook|domain|unavailable|origin|app.?id/i.test(msg)) {
            toast.error(`${msg}. ${domainSetupHint()}`);
          } else {
            toast.error(msg);
          }
        } finally {
          setBusy(false);
        }
      },
      { scope: "email,public_profile" },
    );
  }

  return (
    <button
      type="button"
      className="btn btn-facebook"
      onClick={onClick}
      disabled={busy || (Boolean(appId) && !ready)}
      title={!appId ? "Facebook App ID missing in env" : undefined}
    >
      <span className="f-mark">f</span>
      {busy ? "Connecting…" : label}
    </button>
  );
}
