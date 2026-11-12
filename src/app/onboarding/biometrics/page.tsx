"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  browserSupportsWebAuthn,
  startRegistration,
} from "@simplewebauthn/browser";
import { identityApi } from "@/modules/identity/api";
import { BrandMark } from "@/modules/identity/components/BrandMark";
import { LaptopChrome } from "@/modules/identity/components/LaptopChrome";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAccount } from "@/store/slices/sessionSlice";
import { useToast } from "@/shared/toast/ToastProvider";
import { ButtonLoader } from "@/shared/ui/Loader";
import { getAccessToken } from "@/lib/token";

export default function BiometricsPage() {
  return (
    <RequireAuth seat="EXPERT">
      <BioInner />
    </RequireAuth>
  );
}

function BioInner() {
  const account = useAppSelector((s) => s.session.account)!;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<"fingerprint" | "face" | null>(null);

  useEffect(() => {
    if (!getAccessToken()) router.replace("/");
  }, [router]);

  async function enroll(deviceHint: "fingerprint" | "face") {
    if (!browserSupportsWebAuthn()) {
      toast.error("This browser/device cannot enroll fingerprint or face");
      return;
    }
    setBusy(deviceHint);
    try {
      const token = getAccessToken();
      const optRes = await identityApi.webauthnRegisterOptions(token);
      const attestation = await startRegistration({
        optionsJSON: optRes.data.options as never,
      });
      const res = await identityApi.webauthnRegisterVerify(token, attestation, deviceHint);
      dispatch(setAccount(res.data.account));
      toast.success(res.message || "Device enrolled");
      if (res.data.account.fingerprintEnrolled && res.data.account.faceEnrolled) {
        router.push("/home");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <LaptopChrome
      url="callmetoserve.pk/secure"
      panel={
        <div>
          <BrandMark />
          <p className="eyebrow" style={{ color: "var(--brass)", marginTop: "2rem" }}>
            This phone
          </p>
          <h2 className="display" style={{ fontSize: "2.4rem", margin: "0.5rem 0" }}>
            Enroll both.
          </h2>
          <p className="lede">
            Windows Hello, Touch ID, or the phone sensor. Match stays on the device. We only
            store that this method is enrolled — never a fingerprint image.
          </p>
        </div>
      }
    >
      <p className="eyebrow">This phone</p>
      <h2 className="display" style={{ fontSize: "2rem", margin: "0.2rem 0 0" }}>
        Fingerprint
      </h2>
      <h2 className="display-italic" style={{ fontSize: "2rem", margin: "0.1rem 0 0.75rem" }}>
        and face.
      </h2>
      <p className="lede" style={{ marginBottom: "1.1rem" }}>
        Hello {account.name}. Enroll the sensor this machine actually has.
      </p>

      <div className="bio-grid">
        <button
          type="button"
          className={`bio-card ${account.fingerprintEnrolled ? "active" : ""}`}
          disabled={busy !== null}
          onClick={() => enroll("fingerprint")}
        >
          <div className="bio-icon">◉</div>
          <div style={{ fontWeight: 600 }}>Fingerprint</div>
          <div className="hint">
            {busy === "fingerprint" ? (
              <span className="inline-flex items-center gap-2">
                <ButtonLoader /> Touch sensor…
              </span>
            ) : account.fingerprintEnrolled ? (
              "Ready"
            ) : (
              "Tap to enroll"
            )}
          </div>
        </button>
        <button
          type="button"
          className={`bio-card ${account.faceEnrolled ? "active" : ""}`}
          disabled={busy !== null}
          onClick={() => enroll("face")}
        >
          <div className="bio-icon">☺</div>
          <div style={{ fontWeight: 600 }}>Face</div>
          <div className="hint">
            {busy === "face" ? (
              <span className="inline-flex items-center gap-2">
                <ButtonLoader /> Look at camera…
              </span>
            ) : account.faceEnrolled ? (
              "Ready"
            ) : (
              "Tap to enroll"
            )}
          </div>
        </button>
      </div>

      <div className="note-box">
        <strong>If the sensor fails</strong>
        Google or Facebook is still there. A failed try does not open a second account.
      </div>

      <button
        className="btn btn-primary"
        style={{ marginTop: "1.25rem" }}
        type="button"
        disabled={!account.hasWebAuthn && !account.fingerprintEnrolled && !account.faceEnrolled}
        onClick={() => {
          toast.success("You can sign in with the sensor next time");
          router.push("/home");
        }}
      >
        Continue to home
      </button>
    </LaptopChrome>
  );
}
