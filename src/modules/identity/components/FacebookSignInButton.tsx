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
    };
    fbAsyncInit?: () => void;
  }
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
      if (window.FB) setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    document.body.appendChild(script);
  }, [appId]);

  function onClick() {
    if (!appId) {
      toast.error("Set NEXT_PUBLIC_FACEBOOK_APP_ID in .env.local");
      return;
    }
    if (!window.FB || !ready) {
      toast.info("Facebook SDK still loading");
      return;
    }
    setBusy(true);
    window.FB.login(
      async (response) => {
        try {
          if (!response.authResponse?.accessToken) {
            toast.info("Facebook login cancelled");
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
          toast.error(err instanceof Error ? err.message : "Facebook failed");
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
    >
      <span className="f-mark">f</span>
      {busy ? "Connecting…" : label}
    </button>
  );
}
