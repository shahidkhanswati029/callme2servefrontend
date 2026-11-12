"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { identityApi } from "../api";
import { useAppDispatch } from "@/store/hooks";
import { setSession } from "@/store/slices/sessionSlice";
import { BrandMark } from "./BrandMark";
import { LaptopChrome } from "./LaptopChrome";
import { useToast } from "@/shared/toast/ToastProvider";
import { ButtonLoader } from "@/shared/ui/Loader";

/** Desk seat — email only (no password field). */
export function DeskLoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await identityApi.deskLogin(String(fd.get("email") || ""));
      if (!res.data) throw new Error("Desk sign-in failed");
      dispatch(
        setSession({
          account: res.data.account,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        }),
      );
      toast.success(res.message || "Desk signed in");
      router.push("/desk");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Desk sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LaptopChrome
      url="callme2serve.com/desk"
      panel={
        <div>
          <BrandMark />
          <p className="eyebrow" style={{ color: "var(--brass)", marginTop: "2rem" }}>
            Company desk
          </p>
          <h2 className="display" style={{ fontSize: "2.4rem", margin: "0.5rem 0" }}>
            Not an expert seat.
          </h2>
          <p className="lede">
            Experts use Google / Facebook and the sensor. Desk is the company seat — email only,
            no password.
          </p>
        </div>
      }
    >
      <p className="eyebrow">Desk sign-in</p>
      <h2 className="display" style={{ fontSize: "2rem", margin: "0.25rem 0 0.75rem" }}>
        Super Admin
      </h2>
      <form className="stack-lg" onSubmit={onSubmit}>
        <label className="field">
          <span>Desk email</span>
          <input name="email" type="email" required placeholder="maaali615@gmail.com" />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <ButtonLoader /> Signing in…
            </span>
          ) : (
            "Sign in to desk"
          )}
        </button>
      </form>
      <p className="footer-link">
        <Link href="/login">Expert sensor sign-in</Link>
        {" · "}
        <Link href="/">Landing</Link>
      </p>
    </LaptopChrome>
  );
}
