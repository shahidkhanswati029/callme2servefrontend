"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { getAccessToken } from "@/lib/token";
import { Loader, ButtonLoader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAccount } from "@/store/slices/sessionSlice";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ReferData = {
  code: string | null;
  sharePercent: number;
  durationMonths: number;
  referredCount: number;
  referralBalance: number;
  currency: string;
  referred: Array<{
    id: string;
    name: string;
    work: string | null;
    placeLabel: string | null;
    joinedAt: string;
    endsAt: string;
    active: boolean;
  }>;
};

export default function ReferPage() {
  return (
    <RequireAuth seat="EXPERT">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const account = useAppSelector((s) => s.session.account)!;
  const [data, setData] = useState<ReferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/referrer/me`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message || "Failed");
      setData(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load referrer");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const signupUrl =
    typeof window !== "undefined" && data?.code
      ? `${window.location.origin}/?ref=${data.code}`
      : "";

  async function attach() {
    setBusy(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/referrer/attach`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message || "Failed");
      if (json.data?.account) dispatch(setAccount(json.data.account));
      toast.success("Referrer linked");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Attach failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !data) {
    return (
      <AppShell title="Refer">
        <Loader label="Loading referral…" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Refer">
      <p className="mb-4 text-sm text-muted">
        Share your QR / code. For {data.durationMonths} months you receive {data.sharePercent}% of
        company commission on their completed jobs. Their payout does not shrink. No Stripe.
      </p>

      <div className="mb-4 grid gap-3 rounded-2xl border border-line bg-cream p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase text-brass-deep">Your code</p>
          <strong className="mt-1 block text-xl">{data.code || "—"}</strong>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-brass-deep">Joined</p>
          <strong className="mt-1 block text-xl">{data.referredCount}</strong>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-brass-deep">Referral balance</p>
          <strong className="mt-1 block text-xl">
            {data.currency} {Number(data.referralBalance || 0).toLocaleString()}
          </strong>
        </div>
      </div>

      {signupUrl ? (
        <div className="mb-4 rounded-2xl border border-line bg-paper p-4">
          <p className="text-sm font-semibold">Invite link</p>
          <p className="mt-1 break-all text-sm text-muted">{signupUrl}</p>
          {/* Simple QR via Google Charts — no extra package */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="mt-3 h-40 w-40 rounded-xl border border-line bg-white p-2"
            alt="Referral QR"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(signupUrl)}`}
          />
          <button
            type="button"
            className="mt-3 rounded-lg border border-line px-3 py-2 text-sm font-semibold"
            onClick={async () => {
              await navigator.clipboard.writeText(signupUrl);
              toast.success("Link copied");
            }}
          >
            Copy link
          </button>
        </div>
      ) : null}

      {!account.referredById ? (
        <div className="mb-4 grid gap-2 rounded-2xl border border-line bg-cream p-4">
          <p className="text-sm font-semibold">Were you invited? Enter their code once</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-line bg-paper px-3 py-2"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="REFCODE"
            />
            <button
              type="button"
              disabled={busy || !code}
              onClick={() => void attach()}
              className="rounded-xl bg-forest px-4 py-2 font-semibold text-paper disabled:opacity-50"
            >
              {busy ? <ButtonLoader /> : "Link"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-success">You are already linked to a referrer.</p>
      )}

      <h3 className="font-display mb-2 text-xl font-bold">People you referred</h3>
      {data.referred.length === 0 ? (
        <p className="text-sm text-muted">No one has joined with your code yet.</p>
      ) : (
        <div className="grid gap-2">
          {data.referred.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-line bg-cream px-4 py-3"
            >
              <div>
                <strong>{r.name}</strong>
                <p className="text-sm text-muted">
                  {r.placeLabel || r.work || "Expert"} ·{" "}
                  {r.active ? "Share active" : "Share ended"}
                </p>
              </div>
              <span className="text-xs text-muted">
                {new Date(r.joinedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
