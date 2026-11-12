"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { deskApi, type DeskContact } from "@/modules/desk/api";
import { Loader, ButtonLoader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";

export default function DeskContactDetailPage() {
  return (
    <RequireAuth seat="DESK">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const params = useParams();
  const id = String(params.id || "");
  const [row, setRow] = useState<DeskContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deskNote, setDeskNote] = useState("");
  const [status, setStatus] = useState("READ");

  const load = useCallback(async () => {
    try {
      const res = await deskApi.contact(id);
      setRow(res.data.contact);
      setDeskNote(res.data.contact.deskNote || "");
      setStatus(res.data.contact.status || "READ");
      if (!res.data.contact.readAt && res.data.contact.status === "OPEN") {
        const updated = await deskApi.updateContact(id, { status: "READ" });
        setRow(updated.data.contact);
        setStatus(updated.data.contact.status || "READ");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load detail");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setBusy(true);
    try {
      const res = await deskApi.updateContact(id, {
        status: status as "OPEN" | "READ" | "IN_PROGRESS" | "CLOSED",
        deskNote,
      });
      setRow(res.data.contact);
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !row) {
    return (
      <AppShell title="Contact detail">
        <Loader label="Loading message…" />
      </AppShell>
    );
  }

  return (
    <AppShell title={row.kind === "COMPLAINT" ? "Complaint detail" : "Contact detail"}>
      <div className="mb-4">
        <Link href="/desk/contacts" className="text-sm font-semibold text-forest underline">
          ← Back to inbox
        </Link>
      </div>

      <article className="rounded-2xl border border-line bg-cream p-5">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
              row.kind === "COMPLAINT" ? "bg-[#c45c6a] text-paper" : "bg-forest text-paper"
            }`}
          >
            {row.kind || "CONTACT"}
          </span>
          <span className="rounded border border-line px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
            {row.status || "OPEN"}
          </span>
        </div>

        <h2 className="font-display mt-3 text-2xl font-bold text-forest">{row.name}</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-muted">Email</dt>
            <dd>
              <a className="font-semibold text-forest underline" href={`mailto:${row.email}`}>
                {row.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-muted">City</dt>
            <dd>{row.city || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-muted">Country</dt>
            <dd>{row.country || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-muted">Received</dt>
            <dd>{new Date(row.createdAt).toLocaleString()}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase text-muted">Subject</dt>
            <dd>{row.subject || "—"}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-xl border border-line bg-paper p-4">
          <h3 className="text-xs font-semibold uppercase text-muted">Full message</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{row.message}</p>
        </div>

        <div className="mt-5 grid gap-3">
          <label className="grid gap-1 text-sm font-semibold">
            Status
            <select
              className="rounded-xl border border-line bg-paper px-3 py-2 font-normal"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="OPEN">Open</option>
              <option value="READ">Read</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Desk note (internal)
            <textarea
              rows={4}
              className="rounded-xl border border-line bg-paper px-3 py-2 font-normal"
              value={deskNote}
              onChange={(e) => setDeskNote(e.target.value)}
              placeholder="Follow-up notes for the desk team…"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void save()}
              className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-paper disabled:opacity-50"
            >
              {busy ? <ButtonLoader /> : "Save status & note"}
            </button>
            {row.email ? (
              <a
                href={`mailto:${row.email}?subject=Re:%20CallMe2Serve%20${encodeURIComponent(row.subject || row.kind || "message")}`}
                className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold"
              >
                Reply by email
              </a>
            ) : null}
          </div>
        </div>
      </article>
    </AppShell>
  );
}
