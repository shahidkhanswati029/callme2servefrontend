"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import {
  deskApi,
  type DeskLedgerLine,
  type DeskReceipt,
} from "@/modules/desk/api";
import { ReceiptCard, type PaymentReceipt } from "@/modules/jobs/ReceiptCard";
import { Loader } from "@/shared/ui/Loader";
import { Pagination } from "@/shared/ui/Pagination";
import { useToast } from "@/shared/toast/ToastProvider";

const KINDS = [
  "",
  "QUOTATION",
  "VISIT_FEE",
  "COMMISSION",
  "NET_PAYOUT",
  "REFERRAL_SHARE",
  "PACKAGE_FEE",
  "PAYOUT_RELEASE",
] as const;

const RAILS = ["", "JAZZCASH", "EASYPAISA", "GOOGLE_PAY", "PAYPAL", "DEBIT_CARD"] as const;

export default function DeskMoneyPage() {
  return (
    <RequireAuth seat="DESK">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const [tab, setTab] = useState<"ledger" | "receipts">("ledger");
  const [lines, setLines] = useState<DeskLedgerLine[]>([]);
  const [receipts, setReceipts] = useState<DeskReceipt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [kind, setKind] = useState("");
  const [rail, setRail] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewReceipt, setViewReceipt] = useState<PaymentReceipt | null>(null);
  const pageSize = 25;

  const load = useCallback(async () => {
    try {
      if (tab === "ledger") {
        const res = await deskApi.ledger(page, pageSize, {
          q,
          kind: kind || undefined,
          rail: rail || undefined,
        });
        setLines(res.data.lines);
        setTotal(res.data.total);
      } else {
        const res = await deskApi.receipts(page, pageSize, q || undefined);
        setReceipts(res.data.receipts);
        setTotal(res.data.total);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [kind, page, q, rail, tab, toast]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <AppShell title="Money desk">
      <p className="mb-4 text-sm text-muted">
        Live ledger and receipts from real jobs. Payments auto-release to experts — desk does not
        approve or hold money.
      </p>

      <section className="mb-6 rounded-2xl border border-line bg-mint p-4 text-sm text-ink">
        <h3 className="font-display text-lg font-bold">No desk gate on pay</h3>
        <p className="mt-1 text-muted">
          When an asker pays, commission and net settle immediately. Use filters below to audit —
          not to unlock funds.
        </p>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["ledger", "Ledger"],
            ["receipts", "Receipts"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setPage(1);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === key ? "bg-forest text-paper" : "border border-line bg-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
          placeholder={tab === "ledger" ? "Search note or account" : "Search receipt / names"}
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
        />
        {tab === "ledger" ? (
          <>
            <select
              className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
              value={kind}
              onChange={(e) => {
                setPage(1);
                setKind(e.target.value);
              }}
            >
              {KINDS.map((k) => (
                <option key={k || "all"} value={k}>
                  {k || "All kinds"}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
              value={rail}
              onChange={(e) => {
                setPage(1);
                setRail(e.target.value);
              }}
            >
              {RAILS.map((r) => (
                <option key={r || "all"} value={r}>
                  {r || "All rails"}
                </option>
              ))}
            </select>
          </>
        ) : null}
        <button
          type="submit"
          className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper"
        >
          Filter
        </button>
      </form>

      {loading ? (
        <Loader label="Loading money…" />
      ) : tab === "ledger" ? (
        lines.length === 0 ? (
          <p className="rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
            No ledger lines match.
          </p>
        ) : (
          <div className="grid gap-2">
            {lines.map((l) => (
              <div
                key={l.id}
                className="rounded-xl border border-line bg-cream px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <strong>
                      {l.kind}
                      {l.account ? ` · ${l.account.name}` : ""}
                    </strong>
                    <p className="text-muted">
                      {l.currency} {l.amount.toLocaleString()}
                      {l.rail ? ` · ${l.rail}` : ""}
                      {l.note ? ` · ${l.note}` : ""}
                    </p>
                    {l.job ? (
                      <p className="text-[0.65rem] text-muted">
                        Job {l.job.id.slice(0, 8)}… · {l.job.asker.name} → {l.job.worker.name}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-[0.65rem] text-muted">
                    {new Date(l.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : receipts.length === 0 ? (
        <p className="rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
          No receipts yet — they appear when an asker pays a completed job.
        </p>
      ) : (
        <div className="grid gap-2">
          {receipts.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setViewReceipt(r)}
              className="rounded-xl border border-line bg-cream px-4 py-3 text-left text-sm transition hover:border-forest"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong>{r.receiptNo}</strong>
                  <p className="text-muted">
                    {r.askerName} → {r.workerName} · {r.currency} {r.total} · kept{" "}
                    {r.commission} · net {r.netToWorker} · {r.rail}
                  </p>
                </div>
                <span className="text-[0.65rem] text-muted">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />

      {viewReceipt ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(26,40,34,0.72)] p-4">
          <ReceiptCard receipt={viewReceipt} onClose={() => setViewReceipt(null)} />
        </div>
      ) : null}
    </AppShell>
  );
}
