"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { deskApi, type DeskActivity } from "@/modules/desk/api";
import { Loader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";

export default function DeskActivityPage() {
  return (
    <RequireAuth seat="DESK">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const [activity, setActivity] = useState<DeskActivity | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await deskApi.activity();
      setActivity(res.data.activity);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load activity");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 45000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <AppShell title="Live board">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Real jobs, ledger, receipts, shops, and notifications — refreshes every 45s.
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
        >
          Refresh now
        </button>
      </div>

      {loading && !activity ? (
        <Loader label="Loading live activity…" />
      ) : !activity ? (
        <p className="text-sm text-muted">No activity yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Feed
            title="Jobs"
            href="/desk/jobs"
            rows={activity.jobs.map((j) => ({
              id: j.id,
              title: `${j.asker.name} → ${j.worker.name}`,
              meta: `${j.status} · ${j.currency} ${j.quotation + j.visitFee}`,
              when: j.updatedAt,
            }))}
          />
          <Feed
            title="Ledger"
            href="/desk/money"
            rows={activity.lines.map((l) => ({
              id: l.id,
              title: `${l.kind}${l.account ? ` · ${l.account.name}` : ""}`,
              meta: `${l.currency} ${l.amount.toLocaleString()}${l.note ? ` · ${l.note}` : ""}`,
              when: l.createdAt,
            }))}
          />
          <Feed
            title="Receipts"
            href="/desk/money"
            rows={activity.receipts.map((r) => ({
              id: r.id,
              title: r.receiptNo,
              meta: `${r.askerName} → ${r.workerName} · ${r.currency} ${r.total}`,
              when: r.createdAt,
            }))}
          />
          <Feed
            title="Shops"
            href="/desk/shops"
            rows={activity.shops.map((s) => ({
              id: s.id,
              title: s.name,
              meta: `${s.status} · ${s.owner.name}`,
              when: s.updatedAt,
            }))}
          />
          <Feed
            title="Contacts & complaints"
            href="/desk/contacts"
            rows={(activity.contacts || []).map((c) => ({
              id: c.id,
              title: c.name,
              meta: `${c.email || "—"}${c.city ? ` · ${c.city}` : ""} · ${c.message.slice(0, 80)}`,
              when: c.createdAt,
              href: `/desk/contacts/${c.id}`,
            }))}
          />
          <Feed
            title="Notifications"
            rows={activity.notifications.map((n) => ({
              id: n.id,
              title: `${n.account.name} · ${n.title}`,
              meta: n.body,
              when: n.createdAt,
            }))}
          />
        </div>
      )}
    </AppShell>
  );
}

function Feed({
  title,
  href,
  rows,
}: {
  title: string;
  href?: string;
  rows: Array<{ id: string; title: string; meta: string; when: string; href?: string }>;
}) {
  return (
    <section className="rounded-2xl border border-line bg-cream p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-xl font-bold">{title}</h3>
        {href ? (
          <Link href={href} className="text-xs font-semibold text-forest underline">
            Open
          </Link>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Nothing yet.</p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((r) => {
            const inner = (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <strong>{r.title}</strong>
                  <span className="text-[0.65rem] text-muted">
                    {new Date(r.when).toLocaleString()}
                  </span>
                </div>
                <p className="mt-0.5 text-muted">{r.meta}</p>
              </>
            );
            return (
              <li key={r.id} className="rounded-xl border border-line/70 bg-paper px-3 py-2 text-sm">
                {r.href ? (
                  <Link href={r.href} className="block hover:text-forest">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
