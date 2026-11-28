"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { getAccessToken } from "@/lib/token";
import { Loader, ButtonLoader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";
import { useConfirm } from "@/shared/confirm/ConfirmProvider";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAccount } from "@/store/slices/sessionSlice";
import { t } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const RAILS = ["JAZZCASH", "EASYPAISA", "GOOGLE_PAY", "PAYPAL", "DEBIT_CARD"] as const;
const PK_WALLET_RAILS = ["JAZZCASH", "EASYPAISA"] as const;

type Earnings = {
  available: number;
  netEarned: number;
  referralEarned: number;
  deposited?: number;
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
  const lang = useUiLanguage();
  const toast = useToast();
  const { confirm } = useConfirm();
  const dispatch = useAppDispatch();
  const account = useAppSelector((s) => s.session.account)!;
  const [data, setData] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [packageBusy, setPackageBusy] = useState(false);
  const [depositBusy, setDepositBusy] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [pkg, setPkg] = useState<"SILVER" | "GOLD" | "PLATINUM">("SILVER");
  const [rail, setRail] = useState<(typeof RAILS)[number]>("JAZZCASH");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [rates, setRates] = useState<{
    packages?: Record<string, number>;
    packageUpgradeUsd?: Record<string, number>;
    inquiries?: Record<string, string>;
    radiusKm?: Record<string, number>;
    packageDurationMonths?: number;
    jobCommissionEnabled?: boolean;
  } | null>(null);
  const [walletRail, setWalletRail] = useState<(typeof PK_WALLET_RAILS)[number]>("JAZZCASH");
  const [walletPhone, setWalletPhone] = useState(account.phone || "");
  const [depositAmount, setDepositAmount] = useState("500");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const isPkUser =
    String(account.country || "").toUpperCase() === "PK" ||
    String(account.currency || "").toUpperCase() === "PKR";

  const authHeaders = () => {
    const token = getAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const load = useCallback(async () => {
    try {
      const [earnRes, ratesRes] = await Promise.all([
        fetch(`${API_URL}/api/payments/earnings`, {
          credentials: "include",
          headers: authHeaders(),
        }),
        fetch(`${API_URL}/api/payments/rates?currency=${encodeURIComponent(account.currency)}`, {
          credentials: "include",
          headers: authHeaders(),
        }),
      ]);
      const json = await earnRes.json();
      if (!earnRes.ok || json.success === false) throw new Error(json.error?.message || "Failed");
      setData(json.data);
      const ratesJson = await ratesRes.json();
      if (ratesRes.ok && ratesJson.success !== false) setRates(ratesJson.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load earnings");
    } finally {
      setLoading(false);
    }
  }, [account.currency, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function payPackage() {
    setPackageBusy(true);
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
      const payload = json.data as {
        status?: string;
        mode?: string;
        account?: typeof account;
        checkoutUrl?: string;
        clientSecret?: string;
        provider?: string;
      };
      if (payload.checkoutUrl && payload.status && payload.status !== "SUCCEEDED") {
        toast.success(`Redirecting to ${payload.provider || rail} package checkout…`);
        window.location.href = payload.checkoutUrl;
        return;
      }
      if (payload.clientSecret && payload.status !== "SUCCEEDED") {
        toast.success("Complete card payment with Stripe Elements (client_secret returned).");
        await load();
        return;
      }
      if (payload.account) dispatch(setAccount(payload.account));
      toast.success(
        payload.mode === "live"
          ? `Paid ${pkg} via ${rail}`
          : `Sandbox: ${pkg} via ${rail} (no real money)`,
      );
      setCardNumber("");
      setCardCvc("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pay failed");
    } finally {
      setPackageBusy(false);
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
    setPayoutBusy(true);
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
      setPayoutBusy(false);
    }
  }

  async function setDestination(r: (typeof RAILS)[number]) {
    setPayoutBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/payout-destination`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({
          rail: r,
          ...(PK_WALLET_RAILS.includes(r as (typeof PK_WALLET_RAILS)[number]) && walletPhone.trim()
            ? { walletPhone: walletPhone.trim() }
            : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message || "Failed");
      dispatch(setAccount(json.data.account));
      toast.success("Payout destination saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPayoutBusy(false);
    }
  }

  async function runDeposit() {
    if (!isPkUser) {
      toast.error("JazzCash / EasyPaisa wallet is for Pakistani (PK / PKR) accounts only for now");
      return;
    }
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount < 100) {
      toast.error("Minimum amount is PKR 100");
      return;
    }
    if (!walletPhone.trim()) {
      toast.error("Enter your JazzCash / EasyPaisa mobile number (03XXXXXXXXX)");
      return;
    }
    const ok = await confirm({
      title: "Deposit with mobile wallet",
      message: `Deposit PKR ${amount.toLocaleString()} via ${walletRail} from ${walletPhone.trim()}?`,
      confirmLabel: "Deposit now",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

    setDepositBusy(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${API_URL}/api/payments/deposit`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({
          amount,
          rail: walletRail,
          walletPhone: walletPhone.trim(),
          returnUrl: `${origin}/earnings?deposit=1`,
          cancelUrl: `${origin}/earnings?cancelled=1`,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message || "Failed");
      const payload = json.data as {
        status?: string;
        mode?: string;
        checkoutUrl?: string;
        provider?: string;
      };
      if (payload.checkoutUrl && payload.status && payload.status !== "SUCCEEDED") {
        toast.success(`Redirecting to ${payload.provider || walletRail} deposit…`);
        window.location.href = payload.checkoutUrl;
        return;
      }
      toast.success(
        payload.mode === "live"
          ? `Deposited via ${walletRail}`
          : `Sandbox: deposit via ${walletRail} (no real money until live merchant keys)`,
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setDepositBusy(false);
    }
  }

  async function runWithdraw() {
    if (!isPkUser) {
      toast.error("JazzCash / EasyPaisa wallet is for Pakistani (PK / PKR) accounts only for now");
      return;
    }
    const amount = Number(withdrawAmount || String(data?.available || ""));
    if (!Number.isFinite(amount) || amount < 100) {
      toast.error("Minimum amount is PKR 100");
      return;
    }
    if (!walletPhone.trim()) {
      toast.error("Enter your JazzCash / EasyPaisa mobile number (03XXXXXXXXX)");
      return;
    }
    const ok = await confirm({
      title: "Withdraw to mobile wallet",
      message: `Send PKR ${amount.toLocaleString()} to your ${walletRail} wallet ${walletPhone.trim()}?`,
      confirmLabel: "Withdraw now",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

    setWithdrawBusy(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${API_URL}/api/payments/withdraw`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({
          amount,
          rail: walletRail,
          walletPhone: walletPhone.trim(),
          returnUrl: `${origin}/earnings?withdraw=1`,
          cancelUrl: `${origin}/earnings?cancelled=1`,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error?.message || "Failed");
      const payload = json.data as {
        status?: string;
        mode?: string;
        checkoutUrl?: string;
        provider?: string;
      };
      if (payload.checkoutUrl && payload.status && payload.status !== "SUCCEEDED") {
        toast.success(`Redirecting to ${payload.provider || walletRail} withdraw…`);
        window.location.href = payload.checkoutUrl;
        return;
      }
      toast.success(
        payload.mode === "live"
          ? `Withdrawn via ${walletRail}`
          : `Sandbox: withdraw via ${walletRail} (no real money until live merchant keys)`,
      );
      setWithdrawAmount("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdraw failed");
    } finally {
      setWithdrawBusy(false);
    }
  }

  if (loading || !data) {
    return (
      <AppShell title={t(lang, "earnings")}>
        <Loader label="Loading ledger…" />
      </AppShell>
    );
  }

  return (
    <AppShell title={t(lang, "earningsPayments")}>
      <section className="mb-4 rounded-2xl border border-line bg-mint p-4 text-sm text-ink">
        <h3 className="font-display text-lg font-bold">Payments & company passive income</h3>
        <p className="mt-1 text-muted">
          You earn full job net (commission is 0% for free and paid packages for now) + referral
          package share. Company earns package upgrade fees; job commission can be enabled later.
          Job pay auto-releases — desk does not approve. Rails: JazzCash, Easypaisa, Google Pay,
          PayPal, debit card (Stripe in live).
        </p>
      </section>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Available", data.available],
          ["Deposited", data.deposited || 0],
          ["Job net", data.netEarned],
          ["Referral", data.referralEarned],
          ["Withdrawn", data.released],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-xs font-semibold uppercase text-brass-deep">{label}</p>
            <p className="font-display mt-1 text-2xl font-bold text-forest">
              {account.currency} {Number(value).toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      {isPkUser ? (
        <section className="mb-6 rounded-2xl border border-line bg-cream p-4">
          <h3 className="font-display text-lg font-bold">Pakistan wallet · JazzCash / EasyPaisa</h3>
          <p className="mt-1 text-xs text-muted">
            Deposit money into your CallMe2Serve available balance, or withdraw available funds to
            your JazzCash / EasyPaisa mobile number. Works on phone and laptop. Minimum PKR 100.
            Sandbox credits instantly until live merchant keys are set.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              Wallet
              <select
                className="rounded-xl border border-line bg-paper px-3 py-2.5 font-normal"
                value={walletRail}
                onChange={(e) => setWalletRail(e.target.value as (typeof PK_WALLET_RAILS)[number])}
              >
                {PK_WALLET_RAILS.map((r) => (
                  <option key={r} value={r}>
                    {r === "JAZZCASH" ? "JazzCash" : "EasyPaisa"}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Mobile number
              <input
                className="rounded-xl border border-line bg-paper px-3 py-2.5 font-normal"
                inputMode="tel"
                placeholder="03XXXXXXXXX"
                value={walletPhone}
                onChange={(e) => setWalletPhone(e.target.value)}
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2 rounded-xl border border-line bg-paper p-3">
              <p className="text-sm font-bold">Deposit</p>
              <input
                className="rounded-xl border border-line bg-cream px-3 py-2.5"
                inputMode="decimal"
                placeholder="Amount PKR"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              <button
                type="button"
                disabled={depositBusy || packageBusy || withdrawBusy}
                onClick={() => void runDeposit()}
                className="rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-paper disabled:opacity-50"
              >
                {depositBusy ? <ButtonLoader /> : "Deposit with JazzCash / EasyPaisa"}
              </button>
            </div>

            <div className="grid gap-2 rounded-xl border border-line bg-paper p-3">
              <p className="text-sm font-bold">Withdraw</p>
              <input
                className="rounded-xl border border-line bg-cream px-3 py-2.5"
                inputMode="decimal"
                placeholder={`Amount (available ${data.available.toLocaleString()})`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <button
                type="button"
                disabled={withdrawBusy || packageBusy || depositBusy || data.available < 100}
                onClick={() => void runWithdraw()}
                className="rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-paper disabled:opacity-50"
              >
                {withdrawBusy ? <ButtonLoader /> : "Withdraw to JazzCash / EasyPaisa"}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-6 rounded-2xl border border-line bg-mint p-4 text-sm text-muted">
          JazzCash / EasyPaisa deposit & withdraw is enabled for Pakistani (PK / PKR) accounts for
          now. Set country to Pakistan and currency to PKR in your place settings to use it.
        </section>
      )}

      <section className="mb-6 rounded-2xl border border-line bg-cream p-4">
        <h3 className="font-display text-lg font-bold">Pay package</h3>
        <p className="mt-1 text-xs text-muted">
          USD base: Silver $6 · Gold $12 · Platinum $19 · charged in {account.currency} ·{" "}
          {rates?.packageDurationMonths || 12} months · inquiries{" "}
          {rates?.inquiries?.[pkg] || "Unlimited"}
          {rates?.jobCommissionEnabled ? " · job commission on" : ""}
        </p>
        <div className="mt-3 grid gap-3">
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
                {rates?.packages?.[p] != null
                  ? ` · ${account.currency} ${Number(rates.packages[p]).toLocaleString()}`
                  : ""}
                {rates?.radiusKm?.[p] != null ? ` · ${rates.radiusKm[p]} km` : ""}
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
            type="button"
            disabled={packageBusy || depositBusy || withdrawBusy}
            onClick={() => void payPackage()}
            className="rounded-xl bg-forest px-4 py-3 font-semibold text-paper disabled:opacity-50"
          >
            {packageBusy ? <ButtonLoader /> : `Pay ${pkg}`}
          </button>
        </div>
      </section>

      <section className="mb-6 flex flex-wrap gap-2">
        {RAILS.filter((r) => r !== "DEBIT_CARD").map((r) => (
          <button
            key={r}
            type="button"
            disabled={payoutBusy || packageBusy}
            onClick={() => void setDestination(r)}
            className="rounded-xl border border-line px-3 py-2 text-xs font-semibold"
          >
            Payout → {r.replace("_", " ")}
          </button>
        ))}
        <button
          type="button"
          disabled={payoutBusy || packageBusy || data.available <= 0}
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
