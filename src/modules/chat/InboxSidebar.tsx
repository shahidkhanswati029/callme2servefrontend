"use client";

import Link from "next/link";
import { formatInboxWhen, formatLastSeen } from "@/shared/time";
import type { chatApi } from "@/modules/chat/api";

export type InboxRow = Awaited<
  ReturnType<typeof chatApi.list>
>["data"]["conversations"][number];

function Avatar({
  name,
  photoUrl,
  online,
}: {
  name: string;
  photoUrl: string | null;
  online: boolean;
}) {
  return (
    <div className="relative shrink-0">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-sm font-bold text-paper">
          {(name || "?").slice(0, 1).toUpperCase()}
        </div>
      )}
      <span
        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-cream"
        style={{ backgroundColor: online ? "var(--success)" : "#9aa59c" }}
      />
    </div>
  );
}

export function InboxSidebar({
  rows,
  activeOtherId,
}: {
  rows: InboxRow[];
  activeOtherId?: string;
}) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-line bg-cream">
      <div className="shrink-0 border-b border-line px-4 py-3">
        <h2 className="font-display text-xl font-bold text-ink">Chats</h2>
        <p className="text-xs text-muted">Experts you messaged</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-muted">
            No chats yet. Open an expert from Home and tap Message.
          </p>
        ) : (
          rows.map((c) => {
            const name = c.other.name || "Expert";
            const preview =
              c.lastMessage?.kind === "TEXT"
                ? c.lastMessage.body
                : c.lastMessage?.kind
                  ? c.lastMessage.kind.toLowerCase()
                  : "No messages";
            const active = activeOtherId === c.other.id;
            return (
              <Link
                key={c.id}
                href={`/inbox/${c.other.id}`}
                className={`flex items-center gap-3 border-b border-line/70 px-3 py-3 ${
                  active ? "bg-mint" : "hover:bg-paper"
                }`}
              >
                <Avatar
                  name={name}
                  photoUrl={c.other.photoUrl}
                  online={Boolean(c.other.isOnline)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="truncate text-sm text-ink">{name}</strong>
                    <span className="shrink-0 text-[0.65rem] text-muted">
                      {formatInboxWhen(c.lastMessageAt)}
                    </span>
                  </div>
                  <p className="truncate text-[0.7rem] text-muted">
                    {formatLastSeen(c.other.lastSeenAt, Boolean(c.other.isOnline))}
                  </p>
                  <p className="truncate text-sm text-muted">{preview}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
