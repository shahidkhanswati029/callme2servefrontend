"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { getAccessToken } from "@/lib/token";
import { Loader, ButtonLoader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";
import { useConfirm } from "@/shared/confirm/ConfirmProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAccount } from "@/store/slices/sessionSlice";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const RAILS = ["JAZZCASH", "EASYPAISA", "GOOGLE_PAY", "PAYPAL", "DEBIT_CARD"] as const;

type Earnings = {
  available: number;
  netEarned: number;
  referralEarned: number;
  released: number;
  lines: Array<{
    id: string;
    kind: string;
    amount: number;
    currency: string;
    note: string | null;
    createdAt: string;
    rail?: string | null;
  }>;
};

export default function EarningsPage() {
  return (
    <RequireAuth seat="EXPERT">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const dispatch = useAppDispatch();
  const account = useAppSelector((s) => s.session.account)!;
  const [data, setData] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pkg, setPkg] = useState<"SILVER" | "GOLD" | "PLATINUM">("SILVER");
  const [rail, setRail] = useState<(typeof RAILS)[number]>("JAZZCASH");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const authHeaders = () => {
    const token = getAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/payments/earnings`, {
        credentials: "include",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message || "Failed");
      setData(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load earnings");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function payPackage(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${API_URL}/api/payments/package`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({
          package: pkg,
          rail,
          returnUrl: `${origin}/earnings?paid=1`,
          cancelUrl: `${origin}/earnings?cancelled=1`,
          ...(rail === "DEBIT_CARD"
            ? { cardNumber, cardName, cardExpiry, cardCvc }
            : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message || "Pay failed");
      const data = json.data as {
        status?: string;
        mode?: string;
        account?: typeof account;
        checkoutUrl?: string;
        clientSecret?: string;
        provider?: string;
      };
      if (data.checkoutUrl && data.status && data.status !== "SUCCEEDED") {
        toast.success(`Redirecting to ${data.provider || rail} checkout…`);
        window.location.href = data.checkoutUrl;
        return;
      }
      if (data.clientSecret && data.status !== "SUCCEEDED") {
        toast.success("Complete card payment with Stripe Elements (client_secret returned).");
        await load();
        return;
      }
      if (data.account) dispatch(setAccount(data.account));
      toast.success(
        data.mode === "live"
          ? `Paid ${pkg} via ${rail}`
          : `Sandbox: ${pkg} via ${rail} (no real money)`,
      );
      setCardNumber("");
      setCardCvc("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pay failed");
    } finally {
      setBusy(false);
    }
  }

  async function requestPayout() {
    if (!data?.available) return;
    const ok = await confirm({
      title: "Release available balance",
      message: `Move ${account.currency} ${data.available.toFixed(2)} to your payout rail? Job nets already auto-release on pay — this is for leftover referral / balance.`,
      confirmLabel: "Release now",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/payout-request`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ amount: data.available }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message || "Failed");
      toast.success("Balance released — no desk approval");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payout failed");
    } finally {
      setBusy(false);
    }
  }

  async function setDestination(r: (typeof RAILS)[number]) {
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/payout-destination`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ rail: r }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message || "Failed");
      dispatch(setAccount(json.data.account));
      toast.success("Payout destination saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !data) {
    return (
      <AppShell title="Earnings">
        <Loader label="Loading ledger…" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Earnings & payments">
      <section className="mb-4 rounded-2xl border border-line bg-mint p-4 text-sm text-ink">
        <h3 className="font-display text-lg font-bold">Payments & company passive income</h3>
        <p className="mt-1 text-muted">
          You earn job net + referral share. Company earns package fees + commission (minus
          referral). Job pay auto-releases — desk does not approve. Rails: JazzCash, Easypaisa,
          Google Pay, PayPal, debit card (Stripe in live). Default is sandbox (no real money);
          production needs merchant keys + PAYMENTS_MODE=live.
        </p>
      </section>

      <section className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          ["Available", data.available],
          ["Job net", data.netEarned],
          ["Referral", data.referralEarned],
          ["Released", data.released],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-xs font-semibold uppercase text-brass-deep">{label}</p>
            <p className="font-display mt-1 text-2xl font-bold text-forest">
              {account.currency} {Number(value).toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-6 rounded-2xl border border-line bg-cream p-4">
        <h3 className="font-display text-lg font-bold">Pay package</h3>
        <form className="mt-3 grid gap-3" onSubmit={payPackage}>
          <div className="flex flex-wrap gap-2">
            {(["SILVER", "GOLD", "PLATINUM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPkg(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  pkg === p ? "bg-forest text-paper" : "border border-line"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <select
            className="rounded-xl border border-line bg-paper px-3 py-2"
            value={rail}
            onChange={(e) => setRail(e.target.value as (typeof RAILS)[number])}
          >
            {RAILS.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
          {rail === "DEBIT_CARD" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="rounded-xl border border-line bg-paper px-3 py-2"
                placeholder="Card number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
              />
              <input
                className="rounded-xl border border-line bg-paper px-3 py-2"
                placeholder="Name on card"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
              <input
                className="rounded-xl border border-line bg-paper px-3 py-2"
                placeholder="MM/YY"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
              />
              <input
                className="rounded-xl border border-line bg-paper px-3 py-2"
                placeholder="CVC"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
              />
            </div>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-forest px-4 py-3 font-semibold text-paper disabled:opacity-50"
          >
            {busy ? <ButtonLoader /> : `Pay ${pkg}`}
          </button>
        </form>
      </section>

      <section className="mb-6 flex flex-wrap gap-2">
        {RAILS.filter((r) => r !== "DEBIT_CARD").map((r) => (
          <button
            key={r}
            type="button"
            disabled={busy}
            onClick={() => void setDestination(r)}
            className="rounded-xl border border-line px-3 py-2 text-xs font-semibold"
          >
            Payout → {r.replace("_", " ")}
          </button>
        ))}
        <button
          type="button"
          disabled={busy || data.available <= 0}
          onClick={() => void requestPayout()}
          className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
        >
          Release available
        </button>
      </section>

      <h3 className="font-display mb-2 text-xl font-bold">Ledger</h3>
      <div className="grid gap-2">
        {data.lines.length === 0 ? (
          <p className="text-sm text-muted">No lines yet.</p>
        ) : (
          data.lines.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-xl border border-line bg-cream px-4 py-3 text-sm"
            >
              <div>
                <strong>{l.kind}</strong>
                <p className="text-muted">{l.note || l.rail || "—"}</p>
              </div>
              <span className="font-semibold">
                {l.currency} {Number(l.amount).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
