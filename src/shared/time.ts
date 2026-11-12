/** WhatsApp-style day + time labels for chat and inbox. */
export function formatChatDay(iso: string | Date, now = new Date()): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startToday.getTime() - startMsg.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  if (diffDays >= 7 && diffDays < 14) return "A week ago";
  if (diffDays >= 14 && diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function formatChatTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatInboxWhen(iso: string | Date, now = new Date()): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const day = formatChatDay(d, now);
  if (day === "Today") return formatChatTime(d);
  return day;
}

export function sameChatDay(a: string | Date, b: string | Date): boolean {
  const da = typeof a === "string" ? new Date(a) : a;
  const db = typeof b === "string" ? new Date(b) : b;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** WhatsApp-style last seen line. */
export function formatLastSeen(
  iso: string | Date | null | undefined,
  isOnline: boolean,
  now = new Date(),
): string {
  if (isOnline) return "Online";
  if (!iso) return "Last seen recently";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Last seen just now";
  if (mins < 60) return `Last seen ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  const day = formatChatDay(d, now);
  if (day === "Yesterday") return `Last seen yesterday at ${formatChatTime(d)}`;
  if (day === "Today") return `Last seen today at ${formatChatTime(d)}`;
  return `Last seen ${day} at ${formatChatTime(d)}`;
}
