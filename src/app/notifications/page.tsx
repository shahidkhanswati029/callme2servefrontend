"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import {
  notificationsApi,
  type AppNotification,
} from "@/modules/notifications/api";
import { useSocket } from "@/modules/chat/useSocket";
import { Loader } from "@/shared/ui/Loader";
import { Pagination } from "@/shared/ui/Pagination";
import { useToast } from "@/shared/toast/ToastProvider";
import { formatChatDay, formatChatTime } from "@/shared/time";

export default function NotificationsPage() {
  return (
    <RequireAuth seat="EXPERT">
      <Inner />
    </RequireAuth>
  );
}

function ActorAvatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl?: string | null;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint text-sm font-bold text-forest">
      {initial}
    </span>
  );
}

function Inner() {
  const toast = useToast();
  const [rows, setRows] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const load = useCallback(async () => {
    try {
      const res = await notificationsApi.list(page, pageSize);
      setRows(res.data.notifications);
      setTotal(res.data.total);
      setUnread(res.data.unread);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useSocket({
    onNotification: (p) => {
      const n = p as { title?: string; body?: string };
      toast.info(`${n.title || "Notice"}: ${n.body || ""}`);
      void load();
    },
  });

  async function openOne(n: AppNotification) {
    if (!n.readAt) {
      await notificationsApi.markRead(n.id).catch(() => undefined);
      setRows((prev) =>
        prev.map((row) => (row.id === n.id ? { ...row, readAt: new Date().toISOString() } : row)),
      );
      setUnread((u) => Math.max(0, u - 1));
    }
  }

  return (
    <AppShell title="Notifications">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {unread ? `${unread} unread` : "All caught up"} · name + photo like Facebook
        </p>
        <button
          type="button"
          className="rounded-xl border border-line bg-cream px-3 py-1.5 text-sm font-semibold"
          onClick={async () => {
            await notificationsApi.markAllRead();
            toast.success("All marked read");
            void load();
          }}
        >
          Mark all read
        </button>
      </div>

      {loading ? (
        <Loader label="Loading notifications…" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
          No notifications yet. Job asks, chat, and payments land here.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          {rows.map((n) => {
            const data = (n.data || {}) as {
              conversationId?: string;
              jobId?: string;
              otherId?: string;
              actorName?: string;
            };
            const actorName = n.actor?.name || data.actorName || n.title;
            const href = data.jobId
              ? "/jobs"
              : data.otherId
                ? `/inbox/${data.otherId}`
                : data.conversationId
                  ? "/inbox"
                  : "/notifications";
            return (
              <Link
                key={n.id}
                href={href}
                onClick={() => void openOne(n)}
                className={`flex gap-3 border-b border-line/70 px-4 py-3 last:border-b-0 ${
                  n.readAt ? "bg-cream" : "bg-mint/60"
                }`}
              >
                <ActorAvatar name={actorName} photoUrl={n.actor?.photoUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-sm text-ink">{actorName}</strong>
                    <span className="shrink-0 text-[0.65rem] text-muted">
                      {formatChatDay(n.createdAt)} · {formatChatTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {n.kind === "CHAT" ? n.body : `${n.title}${n.body ? ` — ${n.body}` : ""}`}
                  </p>
                </div>
                {!n.readAt ? (
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brass" />
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
    </AppShell>
  );
}
