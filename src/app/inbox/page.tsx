"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { chatApi } from "@/modules/chat/api";
import { useSocket } from "@/modules/chat/useSocket";
import { InboxSidebar, type InboxRow } from "@/modules/chat/InboxSidebar";
import { Loader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";

export default function InboxPage() {
  return (
    <RequireAuth seat="EXPERT">
      <InboxInner />
    </RequireAuth>
  );
}

function InboxInner() {
  const toast = useToast();
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden bg-paper">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader label="Loading chats…" />
          </div>
        ) : (
          <>
            <div className="flex h-full min-h-0 w-full min-w-0 flex-col lg:w-[320px] lg:shrink-0">
              <InboxSidebar rows={rows} />
            </div>
            <div className="hidden h-full min-h-0 flex-1 items-center justify-center bg-[#efe8d8] p-8 text-center lg:flex">
              <div>
                <p className="font-display text-2xl font-bold text-forest">Select a chat</p>
                <p className="mt-2 text-sm text-muted">
                  Experts stay on the left. Open a thread to message on the right.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
