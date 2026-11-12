"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { deskApi, type DeskBoard } from "@/modules/desk/api";
import { AreaChart, BarChart, DonutChart, LineSpark, StackedBars } from "@/shared/ui/MiniCharts";
import { Loader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";
import { useAppSelector } from "@/store/hooks";

export default function DeskBoardPage() {
  return (
    <RequireAuth seat="DESK">
      <BoardInner />
    </RequireAuth>
  );
}

function BoardInner() {
  const toast = useToast();
  const currency = useAppSelector((s) => s.uiPrefs.currency);
  const [board, setBoard] = useState<DeskBoard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await deskApi.board();
        setBoard(res.data.board);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load board");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  if (loading || !board) {
    return (
      <AppShell title="Super Admin">
        <Loader label="Loading desk board…" />
      </AppShell>
    );
  }

  const packageEntries = Object.entries(board.packages);
  const money = (n: number) => `${currency} ${n.toLocaleString()}`;
  const statusMix = board.jobStatusMix?.length
    ? board.jobStatusMix
    : [
        { label: "OPEN", value: board.openJobs || 0 },
        { label: "ACCEPTED", value: board.inProgressJobs || 0 },
        { label: "COMPLETED", value: board.jobsToday },
      ];
  const railMix = board.railMix?.length
    ? board.railMix
    : [{ label: "NONE", value: 0, commission: 0 }];

  return (
    <AppShell title="Super Admin">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {board.city} · live ledger only · {board.note}
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Link href="/desk/activity" className="rounded-lg border border-line px-3 py-1.5">
            Live feed
          </Link>
          <Link href="/desk/jobs" className="rounded-lg border border-line px-3 py-1.5">
            Jobs
          </Link>
          <Link href="/desk/money" className="rounded-lg border border-line px-3 py-1.5">
            Money & receipts
          </Link>
          <Link href="/desk/contacts" className="rounded-lg border border-line px-3 py-1.5">
            Contacts
          </Link>
        </div>
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {[
          ["Jobs today", String(board.jobsToday)],
          ["Receipts today", String(board.receiptsToday ?? 0)],
          ["Open jobs", String(board.openJobs ?? 0)],
          ["Accepted", String(board.inProgressJobs ?? 0)],
          ["Net passive", money(board.companyNetPassivePkr)],
          ["Commission", money(board.commissionKeptPkr)],
          ["Online", `${board.onlineExperts}/${board.experts}`],
          ["Live shops", `${board.liveShops}/${board.shops}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
              {label}
            </p>
            <p className="font-display mt-2 text-lg font-bold text-forest sm:text-xl">{value}</p>
          </div>
        ))}
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-cream p-4">
          <h3 className="font-display text-xl font-bold">Completed jobs · 14 days</h3>
          <div className="mt-4">
            <AreaChart
              points={board.jobsSeries.map((p) => ({ label: p.day, value: p.jobs }))}
              color="var(--forest)"
              height={200}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-cream p-4">
          <h3 className="font-display text-xl font-bold">Commission / day</h3>
          <div className="mt-4">
            <BarChart
              points={board.jobsSeries.map((p) => ({
                label: p.day,
                value: Math.round(p.commission),
              }))}
              color="var(--brass)"
              height={200}
            />
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-cream p-4">
          <h3 className="font-display text-xl font-bold">Job volume · 14 days</h3>
          <p className="mt-1 text-xs text-muted">Quotation + visit fee on completed jobs</p>
          <div className="mt-4">
            <AreaChart
              points={board.jobsSeries.map((p) => ({
                label: p.day,
                value: Math.round(p.volume || 0),
              }))}
              color="var(--brass-deep)"
              height={180}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-cream p-4">
          <h3 className="font-display text-xl font-bold">Signups vs company in</h3>
          <div className="mt-4">
            <StackedBars
              height={180}
              series={[
                { key: "signups", label: "Expert signups", color: "var(--forest)" },
                { key: "ledgerIn", label: "Commission + packages", color: "var(--brass)" },
              ]}
              points={board.jobsSeries.map((p) => ({
                label: p.day,
                signups: p.signups || 0,
                ledgerIn: Math.round(p.ledgerIn || 0),
              }))}
            />
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-cream p-4">
          <h3 className="font-display mb-4 text-xl font-bold">Job status mix</h3>
          <DonutChart
            centerLabel="jobs"
            slices={statusMix.map((row, i) => ({
              label: row.label,
              value: row.value,
              color: ["var(--forest)", "var(--brass)", "var(--success)", "var(--brass-deep)"][
                i % 4
              ],
            }))}
          />
        </div>

        <div className="rounded-2xl border border-line bg-cream p-4">
          <h3 className="font-display mb-4 text-xl font-bold">Package mix</h3>
          <DonutChart
            centerLabel="pkgs"
            slices={packageEntries.map(([tier, count], i) => ({
              label: `${tier} · ${board.rates[tier]}%`,
              value: count,
              color: ["var(--forest)", "var(--brass)", "var(--brass-deep)", "var(--success)"][
                i % 4
              ],
            }))}
          />
        </div>

        <div className="rounded-2xl border border-line bg-cream p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-display text-xl font-bold">Income mix</h3>
            <Link href="/desk/income" className="text-xs font-semibold text-forest underline">
              Full income desk
            </Link>
          </div>
          <DonutChart
            centerLabel={currency}
            slices={board.incomeMix.map((row, i) => ({
              label: row.label,
              value: Math.abs(row.amount),
              color: ["var(--forest)", "var(--brass)", "var(--brass-deep)"][i % 3],
            }))}
          />
          <p className="mt-4 rounded-xl bg-mint px-3 py-2 text-sm text-forest">
            Auto-released nets · Referral paid: {money(board.referralPaidPkr)}
          </p>
        </div>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-cream p-4">
          <h3 className="font-display text-xl font-bold">Payment rails · completed</h3>
          <div className="mt-4">
            <BarChart
              points={railMix.map((r) => ({ label: r.label, value: r.value }))}
              color="var(--success)"
              height={180}
            />
          </div>
          <ul className="mt-3 grid gap-1 text-xs text-muted">
            {railMix.map((r) => (
              <li key={r.label} className="flex justify-between gap-2">
                <span>{r.label}</span>
                <strong className="text-ink">
                  {r.value} · {money(Math.round(r.commission || 0))}
                </strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-cream p-4">
          <h3 className="font-display text-xl font-bold">Commission spark · 14 days</h3>
          <div className="mt-6">
            <LineSpark
              values={board.jobsSeries.map((p) => Math.round(p.commission))}
              color="var(--forest)"
              height={120}
            />
          </div>
          <p className="mt-4 text-sm text-muted">
            Peak day commission:{" "}
            <strong className="text-ink">
              {money(
                Math.round(Math.max(...board.jobsSeries.map((p) => p.commission), 0)),
              )}
            </strong>
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-mint p-4">
          <p className="text-xs font-semibold uppercase text-brass-deep">Held shops</p>
          <p className="font-display mt-2 text-3xl font-bold text-forest">{board.heldShops}</p>
        </div>
        <div className="rounded-2xl border border-line bg-cream p-4">
          <p className="text-xs font-semibold uppercase text-brass-deep">Live shops</p>
          <p className="font-display mt-2 text-3xl font-bold text-forest">{board.liveShops}</p>
        </div>
        <div className="rounded-2xl border border-line bg-cream p-4">
          <p className="text-xs font-semibold uppercase text-brass-deep">Experts online</p>
          <p className="font-display mt-2 text-3xl font-bold text-forest">
            {board.onlineExperts}
          </p>
        </div>
      </section>
    </AppShell>
  );
}
