"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { chatApi } from "@/modules/chat/api";
import { useSocket } from "@/modules/chat/useSocket";
import { InboxSidebar, type InboxRow } from "@/modules/chat/InboxSidebar";
import { Loader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";

/**
 * Persistent inbox chrome: contact list stays mounted while only the
 * right-hand chat pane swaps between threads (no full-page reload).
 */
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth seat="EXPERT">
      <InboxShell>{children}</InboxShell>
    </RequireAuth>
  );
}

function InboxShell({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const pathname = usePathname();
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);

  const onThread = /^\/inbox\/[^/]+\/?$/.test(pathname);
  const activeOtherId = onThread ? pathname.split("/")[2] : undefined;

  const load = useCallback(async () => {
    try {
      const res = await chatApi.list();
      setRows(res.data.conversations);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load inbox");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useSocket({
    onMessage: () => void load(),
    onPresence: ({ accountId, isOnline, lastSeenAt }) => {
      setRows((prev) =>
        prev.map((row) =>
          row.other.id === accountId
            ? {
                ...row,
                other: {
                  ...row.other,
                  isOnline,
                  lastSeenAt: lastSeenAt ?? row.other.lastSeenAt,
                },
              }
            : row,
        ),
      );
    },
    onNotification: () => void load(),
  });

  return (
    <AppShell fullBleed>
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-paper lg:flex-row">
        <div
          className={`h-full min-h-0 w-full min-w-0 flex-col lg:w-[300px] lg:max-w-[38%] lg:shrink-0 ${
            onThread ? "hidden lg:flex" : "flex"
          }`}
        >
          {loading ? (
            <div className="flex h-full flex-1 items-center justify-center bg-cream">
              <Loader label="Loading chats…" />
            </div>
          ) : (
            <InboxSidebar rows={rows} activeOtherId={activeOtherId} />
          )}
        </div>
        <div
          className={`h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
            onThread ? "flex" : "hidden lg:flex"
          }`}
        >
          {children}
        </div>
      </div>
    </AppShell>
  );
}
