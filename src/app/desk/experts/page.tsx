"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { deskApi } from "@/modules/desk/api";
import { Loader } from "@/shared/ui/Loader";
import { Pagination } from "@/shared/ui/Pagination";
import { useToast } from "@/shared/toast/ToastProvider";

const PACKAGES = ["", "FREE", "SILVER", "GOLD", "PLATINUM"] as const;

export default function DeskExpertsPage() {
  return (
    <RequireAuth seat="DESK">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof deskApi.experts>>["data"]["experts"]
  >([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [pkg, setPkg] = useState("");
  const [online, setOnline] = useState<"all" | "true" | "false">("all");
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const load = useCallback(async () => {
    try {
      const res = await deskApi.experts(page, pageSize, {
        q,
        package: pkg || undefined,
        online: online === "all" ? undefined : online === "true",
      });
      setRows(res.data.experts);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [online, page, pkg, q, toast]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <AppShell title="Experts">
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
          placeholder="Search name, work, or place"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
        />
        <select
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          value={pkg}
          onChange={(e) => {
            setPage(1);
            setPkg(e.target.value);
          }}
        >
          {PACKAGES.map((p) => (
            <option key={p || "all"} value={p}>
              {p || "All packages"}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          value={online}
          onChange={(e) => {
            setPage(1);
            setOnline(e.target.value as "all" | "true" | "false");
          }}
        >
          <option value="all">Online + offline</option>
          <option value="true">Online only</option>
          <option value="false">Offline only</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper"
        >
          Filter
        </button>
      </form>

      {loading ? (
        <Loader label="Loading experts…" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
          No experts match these filters.
        </p>
      ) : (
        <div className="grid gap-2">
          {rows.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-cream px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <strong>{e.name}</strong>
                  <span
                    className={`h-2 w-2 rounded-full ${e.isOnline ? "bg-success" : "bg-line"}`}
                  />
                </div>
                <p className="text-sm text-muted">
                  {e.package} · {e.work || "—"} · {e.placeLabel || "—"} · ★{" "}
                  {Number(e.rating || 0).toFixed(1)}
                  {e.ratingCount != null ? ` (${e.ratingCount})` : ""}
                </p>
              </div>
              <code className="text-[0.65rem] text-muted">{e.id}</code>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
    </AppShell>
  );
}
