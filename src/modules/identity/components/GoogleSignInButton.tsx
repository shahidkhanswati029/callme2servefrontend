"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
      if (!a.work || !a.city) router.push("/onboarding/details");
      else if (!a.hasWebAuthn) router.push("/onboarding/biometrics");
      else router.push("/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google failed");
    } finally {
      setBusy(false);
    }
  }

  if (!clientId) {
    return (
      <button
        type="button"
        className="btn btn-google"
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
    <div style={{ position: "relative" }}>
      <button type="button" className="btn btn-google" disabled={busy}>
        <span className="g-mark">G</span>
        {busy ? "Connecting…" : label}
      </button>
      <div className="oauth-overlay">
        <GoogleLogin
          onSuccess={(cred) => {
            if (cred.credential) void finish(cred.credential);
            else toast.error("Google did not return a token");
          }}
          onError={() => toast.error("Google popup failed")}
          width="400"
        />
      </div>
    </div>
  );
}
