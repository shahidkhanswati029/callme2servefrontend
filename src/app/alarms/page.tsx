"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { notificationsApi, type AppNotification } from "@/modules/notifications/api";
import { useSocket } from "@/modules/chat/useSocket";
import { Loader } from "@/shared/ui/Loader";
import { formatChatDay, formatChatTime } from "@/shared/time";
import { useToast } from "@/shared/toast/ToastProvider";

export default function AlarmsPage() {
  return (
    <RequireAuth seat="EXPERT">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const [rows, setRows] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [quietOn, setQuietOn] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await notificationsApi.list(1, 40);
      setRows(
        res.data.notifications.filter(
          (n) => n.kind === "ALARM" || n.kind === "JOB" || n.kind === "SYSTEM",
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load alarms");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cmts_quiet_hours");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          on?: boolean;
          start?: string;
          end?: string;
        };
        if (typeof parsed.on === "boolean") setQuietOn(parsed.on);
        if (parsed.start) setQuietStart(parsed.start);
        if (parsed.end) setQuietEnd(parsed.end);
      }
    } catch {
      // ignore
    }
    void load();
  }, [load]);

  useSocket({
    onNotification: () => {
      void load();
    },
  });

  function saveQuiet() {
    localStorage.setItem(
      "cmts_quiet_hours",
      JSON.stringify({ on: quietOn, start: quietStart, end: quietEnd }),
    );
    toast.success(
      quietOn
        ? `Quiet hours ${quietStart}–${quietEnd} (device only · safety holds still allowed)`
        : "Quiet hours off",
    );
  }

  return (
    <AppShell title="Alarms">
      <section className="mb-4 rounded-2xl border border-line bg-mint p-4 text-sm">
        <h3 className="font-display text-lg font-bold">Job pings & quiet hours</h3>
        <p className="mt-1 text-muted">
          Alarms are job and system pings from the live notification room. Quiet hours mute toast
          noise on this device — they never call emergency services (plan rule).
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-semibold">
            From
            <input
              type="time"
              className="rounded-lg border border-line bg-paper px-2 py-1.5"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold">
            To
            <input
              type="time"
              className="rounded-lg border border-line bg-paper px-2 py-1.5"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={quietOn}
              onChange={(e) => setQuietOn(e.target.checked)}
            />
            Enable quiet hours
          </label>
          <button
            type="button"
            onClick={saveQuiet}
            className="rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-paper"
          >
            Save
          </button>
        </div>
      </section>

      {loading ? (
        <Loader label="Loading alarm feed…" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
          No job alarms yet. Asks, accepts, and payments appear here and in{" "}
          <Link href="/notifications" className="font-semibold text-forest underline">
            Notifications
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-cream">
          {rows.map((n) => (
            <div
              key={n.id}
              className={`border-b border-line/70 px-4 py-3 last:border-b-0 ${
                n.readAt ? "bg-cream" : "bg-mint/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <strong className="text-sm">{n.title}</strong>
                <span className="text-[0.65rem] text-muted">
                  {formatChatDay(n.createdAt)} · {formatChatTime(n.createdAt)}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted">{n.body}</p>
              <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-brass-deep">
                {n.kind}
              </p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
