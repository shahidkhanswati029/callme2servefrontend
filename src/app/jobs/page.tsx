"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { jobsApi, type JobRow } from "@/modules/jobs/api";
import { PayJobModal, type PayPayload } from "@/modules/jobs/PayJobModal";
import { ReceiptCard, type PaymentReceipt } from "@/modules/jobs/ReceiptCard";
import { RateExpertModal } from "@/modules/ratings/RateExpertModal";
import { useAppSelector } from "@/store/hooks";
import { Loader, ButtonLoader } from "@/shared/ui/Loader";
import { Pagination } from "@/shared/ui/Pagination";
import { useToast } from "@/shared/toast/ToastProvider";
import { useConfirm } from "@/shared/confirm/ConfirmProvider";

const RAILS = ["JAZZCASH", "EASYPAISA", "GOOGLE_PAY", "PAYPAL", "DEBIT_CARD"] as const;

export default function JobsPage() {
  return (
    <RequireAuth seat="EXPERT">
      <Suspense fallback={<Loader full label="Opening jobs…" />}>
        <Inner />
      </Suspense>
    </RequireAuth>
  );
}

function Inner() {
  const me = useAppSelector((s) => s.session.account)!;
  const toast = useToast();
  const { confirm } = useConfirm();
  const search = useSearchParams();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payJob, setPayJob] = useState<JobRow | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [rateTarget, setRateTarget] = useState<{
    expertId: string;
    expertName: string;
    jobId: string;
  } | null>(null);
  const pageSize = 8;

  const [workerId, setWorkerId] = useState(search.get("worker") || "");
  const [quotation, setQuotation] = useState("18000");
  const [visitFee, setVisitFee] = useState("800");
  const [rail, setRail] = useState<(typeof RAILS)[number]>("JAZZCASH");

  useEffect(() => {
    const w = search.get("worker");
    if (w) setWorkerId(w);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const res = await jobsApi.list(page, pageSize);
      setJobs(res.data.jobs);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load jobs");
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function createAsk() {
    if (!workerId.trim()) {
      toast.error("Paste the worker expert id (from Home → Ask job, or chat URL /inbox/ID)");
      return;
    }
    const ok = await confirm({
      title: "Send job ask",
      message: `Ask this expert for ${me.currency} ${Number(quotation) + Number(visitFee)} via ${rail}?`,
      confirmLabel: "Send ask",
    });
    if (!ok) return;
    setBusyId("create");
    try {
      await jobsApi.create({
        workerId: workerId.trim(),
        quotation: Number(quotation),
        visitFee: Number(visitFee),
        rail,
      });
      toast.success("Job ask sent — worker gets a notification");
      setPage(1);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ask failed");
    } finally {
      setBusyId(null);
    }
  }

  async function submitPayment(payload: PayPayload) {
    if (!payJob) return;
    const job = payJob;
    setBusyId(job.id);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await jobsApi.complete(job.id, {
        ...payload,
        returnUrl: `${origin}/jobs?paid=1`,
        cancelUrl: `${origin}/jobs?cancelled=1`,
      });
      if ("pending" in res.data && res.data.pending) {
        if (res.data.checkoutUrl) {
          toast.success(`Redirecting to ${res.data.provider || payload.rail} checkout…`);
          window.location.href = res.data.checkoutUrl;
          return;
        }
        toast.success(res.data.message || "Complete payment with the provider");
        setPayJob(null);
        await load();
        return;
      }
      toast.success("Payment confirmed — receipt generated");
      setPayJob(null);
      if ("receipt" in res.data) setReceipt(res.data.receipt);
      await load();
      setRateTarget({
        expertId: job.worker.id,
        expertName: job.worker.name,
        jobId: job.id,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pay failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell title="Jobs & pay">
      <section className="mb-6 rounded-2xl border border-line bg-mint p-4 text-sm text-ink">
        <h3 className="font-display text-lg font-bold">How payment works</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
          <li>Asker sends a job (quotation + visit fee + preferred rail).</li>
          <li>Worker Accepts.</li>
          <li>
            Asker opens <strong className="text-ink">Pay &amp; complete</strong> and enters wallet /
            card / cash proof — payment cannot finish without those details.
          </li>
          <li>After payment, funds release automatically. Asker rates the worker. Desk does not approve pay.</li>
        </ol>
      </section>

      <section className="mb-6 rounded-2xl border border-line bg-cream p-4">
        <h3 className="font-display text-lg font-bold">New ask</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
            placeholder="Worker expert id"
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
          />
          <select
            className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
            value={rail}
            onChange={(e) => setRail(e.target.value as (typeof RAILS)[number])}
          >
            {RAILS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
            type="number"
            value={quotation}
            onChange={(e) => setQuotation(e.target.value)}
            placeholder="Quotation"
          />
          <input
            className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
            type="number"
            value={visitFee}
            onChange={(e) => setVisitFee(e.target.value)}
            placeholder="Visit fee"
          />
        </div>
        <button
          type="button"
          disabled={busyId === "create"}
          onClick={() => void createAsk()}
          className="mt-3 rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
        >
          {busyId === "create" ? <ButtonLoader /> : "Send job ask"}
        </button>
      </section>

      {loading ? (
        <Loader label="Loading jobs…" />
      ) : jobs.length === 0 ? (
        <p className="rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
          No jobs yet.
        </p>
      ) : (
        <div className="grid gap-2">
          {jobs.map((j) => {
            const iAmWorker = j.workerId === me.id;
            const iAmAsker = j.askerId === me.id;
            const other = iAmWorker ? j.asker : j.worker;
            return (
              <div key={j.id} className="rounded-2xl border border-line bg-cream px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <strong>
                      {iAmWorker ? "Work for" : "Ask to"} {other.name}
                    </strong>
                    <p className="text-sm text-muted">
                      {j.currency} {j.quotation + j.visitFee} · commission {j.packageRate}% ={" "}
                      {j.commission} · net {j.netToWorker} · {j.status}
                      {j.rail ? ` · ${j.rail}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {iAmWorker && j.status === "OPEN" ? (
                      <button
                        type="button"
                        disabled={busyId === j.id}
                        className="rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-paper"
                        onClick={async () => {
                          setBusyId(j.id);
                          try {
                            await jobsApi.accept(j.id);
                            toast.success("Accepted");
                            await load();
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Failed");
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        Accept
                      </button>
                    ) : null}
                    {iAmAsker && j.status === "ACCEPTED" ? (
                      <button
                        type="button"
                        disabled={busyId === j.id}
                        className="rounded-lg bg-brass px-3 py-1.5 text-xs font-semibold text-forest"
                        onClick={() => setPayJob(j)}
                      >
                        Pay & complete
                      </button>
                    ) : null}
                    {j.status === "COMPLETED" && j.receipt ? (
                      <button
                        type="button"
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-forest"
                        onClick={() => setReceipt(j.receipt!)}
                      >
                        View receipt
                      </button>
                    ) : null}
                    {iAmAsker && j.status === "COMPLETED" ? (
                      <button
                        type="button"
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-forest"
                        onClick={() =>
                          setRateTarget({
                            expertId: j.worker.id,
                            expertName: j.worker.name,
                            jobId: j.id,
                          })
                        }
                      >
                        Rate expert
                      </button>
                    ) : null}
                    {j.status !== "COMPLETED" && j.status !== "CANCELLED" ? (
                      <button
                        type="button"
                        disabled={busyId === j.id}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
                        onClick={async () => {
                          setBusyId(j.id);
                          try {
                            await jobsApi.cancel(j.id);
                            toast.success("Cancelled");
                            await load();
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Failed");
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />

      {payJob ? (
        <PayJobModal
          job={payJob}
          busy={busyId === payJob.id}
          onCancel={() => setPayJob(null)}
          onPay={(payload) => void submitPayment(payload)}
        />
      ) : null}

      {receipt ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(26,40,34,0.72)] p-4">
          <ReceiptCard receipt={receipt} onClose={() => setReceipt(null)} />
        </div>
      ) : null}

      {rateTarget ? (
        <RateExpertModal
          expertId={rateTarget.expertId}
          expertName={rateTarget.expertName}
          jobId={rateTarget.jobId}
          onClose={() => setRateTarget(null)}
          onSaved={() => {
            toast.success("Rating saved after job completion");
            setRateTarget(null);
          }}
        />
      ) : null}
    </AppShell>
  );
}
