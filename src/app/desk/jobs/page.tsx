"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { deskApi, type DeskJob } from "@/modules/desk/api";
import { ReceiptCard, type PaymentReceipt } from "@/modules/jobs/ReceiptCard";
import { Loader } from "@/shared/ui/Loader";
import { Pagination } from "@/shared/ui/Pagination";
import { useToast } from "@/shared/toast/ToastProvider";

const STATUSES = ["", "OPEN", "ACCEPTED", "COMPLETED", "CANCELLED"] as const;

export default function DeskJobsPage() {
  return (
    <RequireAuth seat="DESK">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const [rows, setRows] = useState<DeskJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const pageSize = 20;

  const load = useCallback(async () => {
    try {
      const res = await deskApi.jobs(page, pageSize, { q, status: status || undefined });
      setRows(res.data.jobs);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [page, q, status, toast]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <AppShell title="All jobs">
      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(qDraft.trim());
        }}
      >
        <input
          className="min-w-[12rem] flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          placeholder="Search asker, worker, or job id"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
        />
        <select
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper"
        >
          Filter
        </button>
      </form>

      {loading ? (
        <Loader label="Loading jobs…" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
          No jobs match these filters.
        </p>
      ) : (
        <div className="grid gap-2">
          {rows.map((j) => (
            <div
              key={j.id}
              className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong>
                    {j.asker.name} → {j.worker.name}
                  </strong>
                  <p className="text-muted">
                    {j.status} · {j.currency} {j.quotation + j.visitFee} · commission{" "}
                    {j.commission} · net {j.netToWorker}
                    {j.rail ? ` · ${j.rail}` : ""} · {j.worker.package}
                  </p>
                  <p className="mt-1 text-[0.65rem] text-muted">
                    {j.id} · {new Date(j.createdAt).toLocaleString()}
                  </p>
                </div>
                {j.receipt ? (
                  <button
                    type="button"
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
                    onClick={() => setReceipt(j.receipt)}
                  >
                    Receipt {j.receipt.receiptNo}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />

      {receipt ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(26,40,34,0.72)] p-4">
          <ReceiptCard receipt={receipt} onClose={() => setReceipt(null)} />
        </div>
      ) : null}
    </AppShell>
  );
}
