"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileCompletionBar } from "@/modules/home/ProfileCompletionBar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signOut } from "@/store/slices/sessionSlice";
import { useToast } from "@/shared/toast/ToastProvider";
import { useState } from "react";
import { ButtonLoader } from "@/shared/ui/Loader";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "./AuthGuard";
import { uploadMedia } from "@/modules/chat/api";
import { identityApi } from "../api";
import { setAccount } from "@/store/slices/sessionSlice";

export function AccountPanel() {
  return (
    <RequireAuth>
      <AccountInner />
    </RequireAuth>
  );
}

function AccountInner() {
  const account = useAppSelector((s) => s.session.account)!;
  const authBusy = useAppSelector((s) => s.session.authBusy);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  return (
    <AppShell title="Me">
      {account.seat === "EXPERT" ? <ProfileCompletionBar account={account} /> : null}

      <div className="mt-4 rounded-2xl border border-line bg-cream p-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
          {account.seat === "DESK" ? "Desk seat" : account.package}
        </p>
        <h2 className="font-display mt-1 text-2xl font-bold">{account.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {account.seat === "DESK"
            ? "Company seat. Cannot own a shop or take a job."
            : `${account.work || "Expert"} · ${account.placeLabel || account.city || "No place"}`}
        </p>
        {account.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={account.photoUrl}
            alt=""
            className="mt-3 h-20 w-20 rounded-full object-cover"
          />
        ) : null}
        {account.seat === "EXPERT" ? (
          <label className="mt-3 inline-block cursor-pointer rounded-lg border border-line px-3 py-2 text-xs font-semibold">
            {uploading ? (
              <span className="inline-flex items-center gap-2">
                <ButtonLoader dark /> Uploading…
              </span>
            ) : (
              "Upload photo (Cloudinary)"
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const uploaded = await uploadMedia(file);
                  const res = await identityApi.savePhoto(uploaded.url);
                  dispatch(setAccount(res.data.account));
                  toast.success(res.message || "Photo uploaded");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Upload failed");
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-cream p-3">
          <dt className="text-xs font-semibold uppercase text-muted">Place</dt>
          <dd className="mt-1 font-semibold">{account.placeLabel || account.city || "—"}</dd>
        </div>
        <div className="rounded-xl border border-line bg-cream p-3">
          <dt className="text-xs font-semibold uppercase text-muted">Currency</dt>
          <dd className="mt-1 font-semibold">
            {account.country} · {account.currency}
          </dd>
        </div>
        <div className="rounded-xl border border-line bg-cream p-3">
          <dt className="text-xs font-semibold uppercase text-muted">Rating</dt>
          <dd className="mt-1 font-semibold">
            ★ {Number(account.rating || 0).toFixed(1)} ({account.ratingCount})
          </dd>
        </div>
        <div className="rounded-xl border border-line bg-cream p-3">
          <dt className="text-xs font-semibold uppercase text-muted">Body methods</dt>
          <dd className="mt-1 font-semibold">
            Fingerprint {account.fingerprintEnrolled ? "ready" : "open"} · Face{" "}
            {account.faceEnrolled ? "ready" : "open"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-2">
        {account.seat === "EXPERT" ? (
          <>
            <Link
              href="/inbox"
              className="rounded-xl bg-forest px-4 py-3 text-center font-semibold text-paper"
            >
              Open inbox
            </Link>
            <Link
              href="/settings/place"
              className="rounded-xl border border-line px-4 py-3 text-center font-semibold"
            >
              Move place pin
            </Link>
            {!account.hasWebAuthn ? (
              <Link
                href="/onboarding/biometrics"
                className="rounded-xl border border-line px-4 py-3 text-center font-semibold"
              >
                Enroll fingerprint / face
              </Link>
            ) : null}
          </>
        ) : (
          <Link
            href="/desk"
            className="rounded-xl bg-forest px-4 py-3 text-center font-semibold text-paper"
          >
            Open admin board
          </Link>
        )}
        <button
          type="button"
          disabled={authBusy}
          className="rounded-xl border border-line px-4 py-3 font-semibold disabled:opacity-50"
          onClick={async () => {
            await dispatch(signOut());
            toast.info("Signed out");
            router.push("/");
          }}
        >
          {authBusy ? (
            <span className="inline-flex items-center gap-2">
              <ButtonLoader /> Signing out…
            </span>
          ) : (
            "Sign out"
          )}
        </button>
      </div>
    </AppShell>
  );
}
