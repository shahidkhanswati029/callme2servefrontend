"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  browserSupportsWebAuthn,
  startAuthentication,
} from "@simplewebauthn/browser";
import { identityApi } from "../api";
import { useAppDispatch } from "@/store/hooks";
import { setSession } from "@/store/slices/sessionSlice";
import { BrandMark } from "./BrandMark";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { FacebookSignInButton } from "./FacebookSignInButton";
import { LaptopChrome } from "./LaptopChrome";
import { useToast } from "@/shared/toast/ToastProvider";
import { ButtonLoader } from "@/shared/ui/Loader";

export function ExpertLoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function signInWithBiometrics() {
    if (!browserSupportsWebAuthn()) {
      toast.error("This device does not support fingerprint / face sign-in");
      return;
    }
    setBusy(true);
    try {
      const optRes = await identityApi.webauthnLoginOptions();
      const assertion = await startAuthentication({
        optionsJSON: optRes.data.options as never,
      });
      const res = await identityApi.webauthnLoginVerify(assertion);
      if (!res.data) throw new Error("Biometric sign-in failed");
      dispatch(
        setSession({
          account: res.data.account,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        }),
      );
      toast.success(res.message || "Fingerprint matched");
      router.push("/home");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Fingerprint / face did not match. Use Google or Facebook.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <LaptopChrome
      url="callme2serve.com/sign-in"
      panel={
        <div>
          <p className="eyebrow" style={{ color: "var(--brass)" }}>
            Sign in
          </p>
          <h2 className="display" style={{ fontSize: "2.6rem", margin: "0.6rem 0" }}>
            The sensor
          </h2>
          <h2 className="display" style={{ fontSize: "2.6rem", margin: 0 }}>
            knows you.
          </h2>
          <p className="lede" style={{ marginTop: "1rem" }}>
            Fingerprint or face on this device. Google or Facebook is only the
            fallback — same account.
          </p>
        </div>
      }
    >
      <BrandMark />
      <p className="eyebrow">Welcome back</p>
      <h2 className="display" style={{ fontSize: "2rem", margin: "0.25rem 0 1rem" }}>
        Expert sign-in
      </h2>

      <div className="bio-hero">
        <div className="bio-hero-ring">◉</div>
      </div>
      <p style={{ color: "var(--success)", fontWeight: 700, margin: "0 0 0.35rem" }}>
        Use fingerprint or face
      </p>
      <p className="lede" style={{ marginBottom: "1.25rem" }}>
        No email or password. Match happens on this device. We never store a
        fingerprint image.
      </p>

      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={signInWithBiometrics}
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <ButtonLoader /> Waiting for sensor…
          </span>
        ) : (
          "Sign in with fingerprint / face"
        )}
      </button>

      <p className="eyebrow" style={{ marginTop: "1.5rem" }}>
        Fallback, same account
      </p>
      <div className="stack" style={{ marginTop: "0.65rem" }}>
        <GoogleSignInButton />
        <FacebookSignInButton />
      </div>

      <p className="footer-link">
        New here? <Link href="/">Open an account</Link>
        {" · "}
        <Link href="/desk/login">Desk seat</Link>
      </p>
    </LaptopChrome>
  );
}
