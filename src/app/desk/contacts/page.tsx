"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { deskApi, type DeskContact } from "@/modules/desk/api";
import { Loader } from "@/shared/ui/Loader";
import { Pagination } from "@/shared/ui/Pagination";
import { useToast } from "@/shared/toast/ToastProvider";

export default function DeskContactsPage() {
  return (
    <RequireAuth seat="DESK">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const [rows, setRows] = useState<DeskContact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<"ALL" | "CONTACT" | "COMPLAINT">("ALL");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const load = useCallback(async () => {
    try {
      const res = await deskApi.contacts(page, pageSize, {
        kind,
        status: status || undefined,
        q: q.trim() || undefined,
      });
      setRows(res.data.contacts);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load contacts");
    } finally {
      setLoading(false);
    }
  }, [page, kind, status, q, toast]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <AppShell title="Contacts & complaints">
      <p className="mb-4 text-sm text-muted">
        Landing <Link href="/contact" className="font-semibold text-forest underline">/contact</Link>{" "}
        messages and complaints open here in full detail for the super-admin desk.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["ALL", "CONTACT", "COMPLAINT"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setPage(1);
              setKind(k);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              kind === k ? "bg-forest text-paper" : "border border-line"
            }`}
          >
            {k === "ALL" ? "All" : k === "COMPLAINT" ? "Complaints" : "Contacts"}
          </button>
        ))}
        <select
          className="rounded-lg border border-line bg-paper px-2 py-1.5 text-xs"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">Any status</option>
          <option value="OPEN">Open</option>
          <option value="READ">Read</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="CLOSED">Closed</option>
        </select>
        <input
          className="min-w-[180px] flex-1 rounded-lg border border-line bg-paper px-3 py-1.5 text-xs"
          placeholder="Search name, email, message…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              void load();
            }
          }}
        />
      </div>

      {loading ? (
        <Loader label="Loading contacts…" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-cream p-6 text-sm text-muted">
          No messages yet. Submit the form on /contact to test.
        </p>
      ) : (
        <div className="grid gap-3">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/desk/contacts/${c.id}`}
              className="rounded-2xl border border-line bg-cream p-4 transition hover:border-forest"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="mb-1 flex flex-wrap gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.kind === "COMPLAINT"
                          ? "bg-[#c45c6a] text-paper"
                          : "bg-forest text-paper"
                      }`}
                    >
                      {c.kind || "CONTACT"}
                    </span>
                    <span className="rounded border border-line px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                      {c.status || "OPEN"}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-forest">{c.name}</h3>
                  <p className="text-xs text-muted">
                    {c.email || "—"}
                    {c.city ? ` · ${c.city}` : ""}
                    {c.subject ? ` · ${c.subject}` : ""}
                  </p>
                </div>
                <time className="text-xs text-muted">
                  {new Date(c.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-ink">
                {c.preview || c.message}
              </p>
              <p className="mt-2 text-xs font-semibold text-forest">Open full detail →</p>
            </Link>
          ))}
          <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </div>
      )}
    </AppShell>
  );
}
