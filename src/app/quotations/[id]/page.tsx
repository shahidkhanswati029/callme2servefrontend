"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { quotationsApi, type QuotationRequest } from "@/modules/quotations/api";
import { useToast } from "@/shared/toast/ToastProvider";
import { ButtonLoader, Loader } from "@/shared/ui/Loader";
import { useAppSelector } from "@/store/hooks";
import { t, tDynamic } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

export default function QuotationDetailPage() {
  return (
    <RequireAuth seat="EXPERT">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const account = useAppSelector((s) => s.session.account)!;
  const lang = useUiLanguage();
  const [data, setData] = useState<QuotationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [priceAmount, setPriceAmount] = useState("");
  const [arriveInMinutes, setArriveInMinutes] = useState("30");
  const [finishInMinutes, setFinishInMinutes] = useState("60");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quotationsApi.get(String(id));
      setData(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t(lang, "notFound"));
    } finally {
      setLoading(false);
    }
  }, [id, lang, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const isAsker = data?.askerId === account.id;

  async function onBid(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await quotationsApi.placeBid(String(id), {
        message: message.trim() || undefined,
        priceAmount: Number(priceAmount),
        arriveInMinutes: Number(arriveInMinutes),
        finishInMinutes: Number(finishInMinutes),
      });
      toast.success(t(lang, "bidSent"));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t(lang, "bidFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function decide(bidId: string, decision: "accept" | "reject") {
    setBusy(true);
    try {
      if (decision === "accept") await quotationsApi.accept(bidId);
      else await quotationsApi.reject(bidId);
      toast.success(decision === "accept" ? t(lang, "jobBooked") : t(lang, "bidRejected"));
      await load();
      if (decision === "accept") router.push("/jobs");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t(lang, "actionFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (loading || !data) {
    return (
      <AppShell title={t(lang, "quotations")}>
        <Loader />
      </AppShell>
    );
  }

  return (
    <AppShell title={data.category}>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <div className="rounded-2xl border border-line bg-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-lg font-bold text-forest">{tDynamic(lang, data.category)}</h1>
            <span className="rounded-lg bg-mint px-2 py-1 text-xs font-semibold">
              {tDynamic(lang, data.status)}
              {data.distanceKm != null ? ` · ${data.distanceKm} km` : ""}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {data.asker?.name || ""} · {data.city || data.country} · {t(lang, "inquiries")}:{" "}
            {t(lang, "unlimited")}
          </p>
          {data.title ? <p className="mt-2 font-semibold">{data.title}</p> : null}
          {data.notes ? <p className="mt-1 text-sm">{data.notes}</p> : null}
          <video src={data.videoUrl} controls className="mt-3 max-h-72 w-full rounded-xl" />
        </div>

        {isAsker ? (
          <div className="space-y-3">
            <h2 className="font-bold">{t(lang, "bidsRanked")}</h2>
            {(data.bids || []).length === 0 ? (
              <p className="text-sm text-muted">{t(lang, "noBidsYet")}</p>
            ) : (
              (data.bids || []).map((b) => (
                <div key={b.id} className="rounded-2xl border border-line bg-paper p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{b.bidder?.name || b.bidderId}</strong>
                    <span className="text-xs font-semibold text-forest">{b.distanceKm} km</span>
                  </div>
                  <p className="mt-1 text-sm">
                    {b.currency} {b.priceAmount} · {t(lang, "arriveIn")} {b.arriveInMinutes}{" "}
                    {t(lang, "minutes")} · {t(lang, "finishIn")} {b.finishInMinutes}{" "}
                    {t(lang, "minutes")}
                  </p>
                  {b.message ? <p className="mt-1 text-sm text-muted">{b.message}</p> : null}
                  <p className="mt-1 text-xs">
                    ★ {Number(b.bidder?.rating || 0).toFixed(1)} · {b.bidder?.package} · {b.status}
                  </p>
                  {b.status === "PENDING" && data.status === "OPEN" ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void decide(b.id, "accept")}
                        className="rounded-xl bg-forest px-3 py-2 text-xs font-semibold text-paper"
                      >
                        {t(lang, "accept")}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void decide(b.id, "reject")}
                        className="rounded-xl border border-line px-3 py-2 text-xs font-semibold"
                      >
                        {t(lang, "reject")}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : data.status === "OPEN" ? (
          <form onSubmit={onBid} className="space-y-3 rounded-2xl border border-line bg-paper p-4">
            <h2 className="font-bold">{t(lang, "sendBid")}</h2>
            <p className="text-xs text-muted">{t(lang, "bidRequiresPortfolio")}</p>
            <label className="block text-sm font-semibold">
              {t(lang, "priceAmount")} ({data.currency})
              <input
                required
                type="number"
                min={1}
                step="0.01"
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                value={priceAmount}
                onChange={(e) => setPriceAmount(e.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                {t(lang, "arriveInMinutes")}
                <input
                  required
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                  value={arriveInMinutes}
                  onChange={(e) => setArriveInMinutes(e.target.value)}
                />
              </label>
              <label className="block text-sm font-semibold">
                {t(lang, "finishInMinutes")}
                <input
                  required
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                  value={finishInMinutes}
                  onChange={(e) => setFinishInMinutes(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              {t(lang, "messageOptional")}
              <textarea
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper"
            >
              {busy ? <ButtonLoader /> : t(lang, "sendBid")}
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted">{t(lang, "quotationClosed")}</p>
        )}
      </div>
    </AppShell>
  );
}
