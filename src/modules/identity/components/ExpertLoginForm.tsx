"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  platformAuthenticatorAvailable,
  readLocalWebAuthnCredIds,
  rememberLocalWebAuthnCredId,
} from "../webauthnLocal";

export function ExpertLoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [sensorOk, setSensorOk] = useState(true);

  useEffect(() => {
    void platformAuthenticatorAvailable().then(setSensorOk);
  }, []);

  async function signInWithBiometrics() {
    if (!browserSupportsWebAuthn()) {
      toast.info("No fingerprint / face on this device. Continue with Google or Facebook.");
      return;
    }
    setBusy(true);
    try {
      const localCreds = readLocalWebAuthnCredIds();
      const optRes = await identityApi.webauthnLoginOptions(localCreds);
      const assertion = await startAuthentication({
        optionsJSON: optRes.data.options as never,
      });
      if (assertion?.id) rememberLocalWebAuthnCredId(assertion.id);
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
      router.replace("/home");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (/not.?allowed|abort|cancel/i.test(msg)) {
        toast.info("Fingerprint / face cancelled. You can try again or use Google / Facebook.");
      } else if (/unknown|no enrolled|WEBAUTHN_UNKNOWN/i.test(msg)) {
        toast.error(
          "No fingerprint enrolled on this phone yet. Sign in with Google or Facebook once, then enroll fingerprint on this device.",
        );
      } else {
        toast.error(
          msg || "Fingerprint / face did not match. Use Google or Facebook.",
        );
      }
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
            {sensorOk ? "The sensor" : "Google or"}
          </h2>
          <h2 className="display" style={{ fontSize: "2.6rem", margin: 0 }}>
            {sensorOk ? "knows you." : "Facebook."}
          </h2>
          <p className="lede" style={{ marginTop: "1rem" }}>
            {sensorOk
              ? "Fingerprint or face on this device. Google or Facebook is the fallback — same account."
              : "This device has no fingerprint or face sensor. Continue with Google or Facebook."}
          </p>
        </div>
      }
    >
      <BrandMark />
      <p className="eyebrow">Welcome back</p>
      <h2 className="display" style={{ fontSize: "2rem", margin: "0.25rem 0 1rem" }}>
        Expert sign-in
      </h2>

      {sensorOk ? (
        <>
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
            Or continue without the sensor
          </p>
        </>
      ) : (
        <>
          <div className="note-box" style={{ marginBottom: "1.1rem" }}>
            <strong>No fingerprint / face on this device</strong>
            Continue with Google or Facebook — same expert account.
          </div>
          <p className="eyebrow">Continue without biometrics</p>
        </>
      )}

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
