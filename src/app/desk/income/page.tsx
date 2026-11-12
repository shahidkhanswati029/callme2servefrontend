"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { deskApi, type DeskBoard } from "@/modules/desk/api";
import { Loader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";

export default function DeskIncomePage() {
  return (
    <RequireAuth seat="DESK">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const [board, setBoard] = useState<DeskBoard | null>(null);

  useEffect(() => {
    void deskApi
      .board()
      .then((res) => setBoard(res.data.board))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"));
  }, [toast]);

  if (!board) {
    return (
      <AppShell title="Company income">
        <Loader label="Loading ledger totals…" />
      </AppShell>
    );
  }

  const pie = [
    { label: "Job commission", value: board.commissionKeptPkr, color: "var(--forest)" },
    { label: "Package fees", value: board.packageIncomePkr, color: "var(--brass)" },
    { label: "Referral share out", value: board.referralPaidPkr, color: "var(--brass-deep)" },
  ];
  const total = Math.max(
    pie.reduce((s, p) => s + p.value, 0),
    1,
  );

  let angle = 0;
  const slices = pie.map((p) => {
    const start = angle;
    const sweep = (p.value / total) * 360;
    angle += sweep;
    return { ...p, start, sweep };
  });

  return (
    <AppShell title="Company passive income">
      <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
        <Link href="/desk/money" className="rounded-lg border border-line px-3 py-1.5">
          Ledger & receipts
        </Link>
        <Link href="/desk/jobs" className="rounded-lg border border-line px-3 py-1.5">
          All jobs
        </Link>
      </div>
      <section className="mb-6 rounded-2xl border border-line bg-mint p-4 text-sm">
        <h3 className="font-display text-lg font-bold text-ink">How the company earns</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>
            <strong className="text-ink">Package fees</strong> — Silver / Gold / Platinum monthly
            (PKR 1,500 / 3,500 / 6,000).
          </li>
          <li>
            <strong className="text-ink">Job commission</strong> — Free 12%, Silver 9%, Gold 6%,
            Platinum 2% of quotation + visit fee.
          </li>
          <li>
            <strong className="text-ink">Referral share</strong> — 25% of that commission (default)
            goes to the referrer for 6 months; company keeps the rest. Expert net is never shrunk.
          </li>
          <li>
            Desk only <strong className="text-ink">releases payouts</strong> — pending queue PKR{" "}
            {board.payoutPendingPkr.toLocaleString()}.
          </li>
        </ul>
      </section>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-cream p-4">
          <p className="text-xs font-semibold uppercase text-brass-deep">Net passive (approx)</p>
          <p className="font-display mt-2 text-4xl font-bold text-forest">
            PKR {board.companyNetPassivePkr.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-muted">
            commission + packages − referral share
          </p>
        </div>
        <div className="flex items-center justify-center rounded-2xl border border-line bg-cream p-4">
          <svg viewBox="0 0 120 120" className="h-44 w-44">
            {slices.map((s) => {
              if (s.sweep <= 0) return null;
              const r = 48;
              const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
              const x1 = 60 + r * Math.cos(rad(s.start));
              const y1 = 60 + r * Math.sin(rad(s.start));
              const x2 = 60 + r * Math.cos(rad(s.start + s.sweep));
              const y2 = 60 + r * Math.sin(rad(s.start + s.sweep));
              const large = s.sweep > 180 ? 1 : 0;
              return (
                <path
                  key={s.label}
                  d={`M60 60 L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                  fill={s.color}
                />
              );
            })}
            <circle cx="60" cy="60" r="24" fill="var(--cream)" />
          </svg>
        </div>
      </div>

      <div className="grid gap-2">
        {pie.map((p) => (
          <div
            key={p.label}
            className="flex items-center justify-between rounded-xl border border-line bg-cream px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
              {p.label}
            </span>
            <span className="font-bold text-forest">PKR {p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
