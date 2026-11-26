"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { identityApi } from "../api";
import { useAppDispatch } from "@/store/hooks";
import { setSession } from "@/store/slices/sessionSlice";
import { useToast } from "@/shared/toast/ToastProvider";

export function GoogleSignInButton({
  label = "Continue with Google",
}: {
  label?: string;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [btnWidth, setBtnWidth] = useState(320);
  const wrapRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const sync = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setBtnWidth(w);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  async function finish(idToken: string) {
    setBusy(true);
    try {
      const res = await identityApi.google(idToken);
      if (!res.data) throw new Error("Google sign-in failed");
      dispatch(
        setSession({
          account: res.data.account,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        }),
      );
      toast.success(res.message || "Google sign-in successful");
      const a = res.data.account;
      if (!a.city?.trim() || !a.placeLabel?.trim()) router.replace("/onboarding/details");
      else router.replace("/home");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google failed";
      if (/not found|unavailable|disabled|blocked/i.test(msg)) {
        toast.error(
          "This Google account cannot sign in right now. Check that the account exists and Google login is enabled for this app.",
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!clientId) {
    return (
      <button
        type="button"
        className="btn btn-google cursor-pointer"
        onClick={() =>
          toast.error("Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local")
        }
      >
        <span className="g-mark">G</span>
        {label}
      </button>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <button type="button" className="btn btn-google pointer-events-none" disabled={busy} tabIndex={-1} aria-hidden>
        <span className="g-mark">G</span>
        {busy ? "Connecting…" : label}
      </button>
      {/* Invisible Google widget stretched to the full custom button — fixes desktop right-side dead clicks. */}
      <div className="oauth-overlay" aria-label={label}>
        <GoogleLogin
          onSuccess={(cred) => {
            if (cred.credential) void finish(cred.credential);
            else toast.error("Google did not return a token");
          }}
          onError={() =>
            toast.error(
              "Google sign-in is unavailable right now. Try another account or try again in a moment.",
            )
          }
          width={String(Math.max(240, btnWidth))}
          text="continue_with"
          shape="rectangular"
          theme="outline"
          size="large"
        />
      </div>
    </div>
  );
}
