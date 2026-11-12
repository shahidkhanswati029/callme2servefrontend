"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { deskApi } from "@/modules/desk/api";
import { Loader, ButtonLoader } from "@/shared/ui/Loader";
import { Pagination } from "@/shared/ui/Pagination";
import { useToast } from "@/shared/toast/ToastProvider";
import { useConfirm } from "@/shared/confirm/ConfirmProvider";

const STATUSES = ["", "LIVE", "HELD"] as const;

export default function DeskShopsPage() {
  return (
    <RequireAuth seat="DESK">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof deskApi.shops>>["data"]["shops"]
  >([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const pageSize = 20;

  const load = useCallback(async () => {
    try {
      const res = await deskApi.shops(page, pageSize, {
        q,
        status: status || undefined,
      });
      setRows(res.data.shops);
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
    <AppShell title="Shops">
      <p className="mb-4 text-sm text-muted">
        Hold removes a shop from the live map. Release only works when pin + door photo exist.
      </p>

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
          placeholder="Search shop or owner"
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
        <Loader label="Loading shops…" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
          No shops match these filters.
        </p>
      ) : (
        <div className="grid gap-2">
          {rows.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-cream px-4 py-3"
            >
              <div>
                <strong>{s.name}</strong>
                <p className="text-sm text-muted">
                  {s.owner.name} · {s.status}
                  {s.heldReason ? ` · ${s.heldReason}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {s.status !== "HELD" ? (
                  <button
                    type="button"
                    disabled={busyId === s.id}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Hold shop",
                        message: `Put “${s.name}” on hold? It leaves the live map.`,
                        confirmLabel: "Hold shop",
                        tone: "danger",
                      });
                      if (!ok) return;
                      setBusyId(s.id);
                      try {
                        await deskApi.holdShop(s.id);
                        toast.success("Shop held");
                        await load();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Hold failed");
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    {busyId === s.id ? <ButtonLoader /> : "Hold"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === s.id}
                    className="rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-paper"
                    onClick={async () => {
                      setBusyId(s.id);
                      try {
                        await deskApi.releaseShop(s.id);
                        toast.success("Release checked");
                        await load();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Release failed");
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    {busyId === s.id ? <ButtonLoader /> : "Release"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
    </AppShell>
  );
}
