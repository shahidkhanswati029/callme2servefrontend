"use client";

import { useState } from "react";
import type { JobRow } from "./api";

const RAILS = ["JAZZCASH", "EASYPAISA", "GOOGLE_PAY", "PAYPAL", "DEBIT_CARD"] as const;

export type PayPayload = {
  rail: (typeof RAILS)[number];
  walletPhone?: string;
  accountEmail?: string;
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvc?: string;
};

type Props = {
  job: JobRow;
  busy?: boolean;
  onCancel: () => void;
  onPay: (payload: PayPayload) => void;
};

export function PayJobModal({ job, busy, onCancel, onPay }: Props) {
  const initial =
    job.rail && (RAILS as readonly string[]).includes(job.rail)
      ? (job.rail as (typeof RAILS)[number])
      : "JAZZCASH";
  const [rail, setRail] = useState<(typeof RAILS)[number]>(initial);
  const [walletPhone, setWalletPhone] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [error, setError] = useState("");

  const total = job.quotation + job.visitFee;

  function submit() {
    setError("");
    if (rail === "DEBIT_CARD") {
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length < 12 || digits.length > 19) {
        setError("Enter a valid card number (12–19 digits).");
        return;
      }
      if (!cardName.trim()) {
        setError("Cardholder name is required.");
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
        setError("Expiry must be MM/YY.");
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvc.trim())) {
        setError("CVC must be 3–4 digits.");
        return;
      }
    } else if (rail === "JAZZCASH" || rail === "EASYPAISA") {
      const phone = walletPhone.replace(/\D/g, "");
      if (phone.length < 10 || phone.length > 13) {
        setError("Enter the wallet mobile number (10–13 digits).");
        return;
      }
    } else if (rail === "GOOGLE_PAY" || rail === "PAYPAL") {
      if (!accountEmail.includes("@")) {
        setError("Enter the account email used for this rail.");
        return;
      }
    }

    onPay({
      rail,
      walletPhone: walletPhone || undefined,
      accountEmail: accountEmail || undefined,
      cardNumber: cardNumber || undefined,
      cardName: cardName || undefined,
      cardExpiry: cardExpiry || undefined,
      cardCvc: cardCvc || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(26,40,34,0.72)] p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-cream shadow-[0_20px_50px_rgba(26,40,34,0.28)]">
        <div className="h-1.5 w-full bg-brass" />
        <div className="p-5">
          <h3 className="font-display text-xl font-bold text-ink">Enter payment details</h3>
          <p className="mt-1 text-sm text-muted">
            Pay {job.currency} {total.toLocaleString()} to complete this job. Company commission{" "}
            {job.currency} {job.commission.toLocaleString()}. Cash is not available. Payment
            releases to the expert automatically — desk does not approve.
          </p>

          <label className="mt-4 grid gap-1 text-sm font-semibold">
            Payment rail
            <select
              className="rounded-xl border border-line bg-paper px-3 py-2 font-normal"
              value={rail}
              onChange={(e) => setRail(e.target.value as (typeof RAILS)[number])}
            >
              {RAILS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          {(rail === "JAZZCASH" || rail === "EASYPAISA") && (
            <label className="mt-3 grid gap-1 text-sm font-semibold">
              Wallet mobile number
              <input
                className="rounded-xl border border-line bg-paper px-3 py-2 font-normal"
                inputMode="tel"
                placeholder="03XXXXXXXXX"
                value={walletPhone}
                onChange={(e) => setWalletPhone(e.target.value)}
              />
            </label>
          )}

          {(rail === "GOOGLE_PAY" || rail === "PAYPAL") && (
            <label className="mt-3 grid gap-1 text-sm font-semibold">
              Account email
              <input
                className="rounded-xl border border-line bg-paper px-3 py-2 font-normal"
                type="email"
                placeholder="you@example.com"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
              />
            </label>
          )}

          {rail === "DEBIT_CARD" && (
            <div className="mt-3 grid gap-2">
              <label className="grid gap-1 text-sm font-semibold">
                Card number
                <input
                  className="rounded-xl border border-line bg-paper px-3 py-2 font-normal"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="•••• •••• •••• ••••"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Name on card
                <input
                  className="rounded-xl border border-line bg-paper px-3 py-2 font-normal"
                  autoComplete="cc-name"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-sm font-semibold">
                  Expiry (MM/YY)
                  <input
                    className="rounded-xl border border-line bg-paper px-3 py-2 font-normal"
                    autoComplete="cc-exp"
                    placeholder="08/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  CVC
                  <input
                    className="rounded-xl border border-line bg-paper px-3 py-2 font-normal"
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}

          {error ? <p className="mt-3 text-sm font-semibold text-brass-deep">{error}</p> : null}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-line bg-paper px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
            >
              {busy ? "Paying…" : "Confirm payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
