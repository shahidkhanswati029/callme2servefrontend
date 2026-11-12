"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { chatApi, uploadMedia, type ChatMessage } from "@/modules/chat/api";
import { useSocket } from "@/modules/chat/useSocket";
import { ChatMediaThumb, MediaLightbox } from "@/modules/chat/MediaLightbox";
import { MediaPrepareModal } from "@/modules/chat/MediaPrepareModal";
import Link from "next/link";
import { InboxSidebar, type InboxRow } from "@/modules/chat/InboxSidebar";
import { useAppSelector } from "@/store/hooks";
import { Loader, ButtonLoader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";
import { useConfirm } from "@/shared/confirm/ConfirmProvider";
import {
  formatChatDay,
  formatChatTime,
  formatLastSeen,
  sameChatDay,
} from "@/shared/time";
import { t, type UiLanguage } from "@/shared/i18n";
import { downloadMedia, mediaFilename } from "@/shared/media/downloadMedia";

const IMAGE_CAP = 5;
const VIDEO_CAP = 3;

export default function ThreadPage() {
  return (
    <RequireAuth seat="EXPERT">
      <ThreadInner />
    </RequireAuth>
  );
}

function ReadTicks({ read }: { read: boolean }) {
  return (
    <span
      className="ml-1 text-[0.7rem] font-bold tracking-tighter"
      style={{ color: read ? "#7dd3b5" : "rgba(255,252,248,0.55)" }}
      title={read ? "Read" : "Sent"}
    >
      {read ? "✓✓" : "✓"}
    </span>
  );
}

function ThreadInner() {
  const { otherId } = useParams<{ otherId: string }>();
  const me = useAppSelector((s) => s.session.account);
  const lang = (me?.uiLanguage || "en") as UiLanguage;
  const toast = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [other, setOther] = useState<{
    id: string;
    name: string;
    photoUrl: string | null;
    work: string | null;
    placeLabel: string | null;
    isOnline: boolean;
    lastSeenAt: string | null;
    rating: number;
    ratingCount: number;
  } | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState<{ kind: "IMAGE" | "VIDEO"; url: string } | null>(
    null,
  );
  const [prepare, setPrepare] = useState<{ file: File; kind: "IMAGE" | "VIDEO" } | null>(
    null,
  );
  const [inboxRows, setInboxRows] = useState<InboxRow[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const conversationIdRef = useRef<string | null>(null);

  const myImages = messages.filter(
    (m) => m.senderId === me?.id && m.kind === "IMAGE" && !m.deleted,
  ).length;
  const myVideos = messages.filter(
    (m) => m.senderId === me?.id && m.kind === "VIDEO" && !m.deleted,
  ).length;

  const load = useCallback(async () => {
    try {
      const [res, list] = await Promise.all([chatApi.open(otherId), chatApi.list()]);
      setConversationId(res.data.conversation.id);
      conversationIdRef.current = res.data.conversation.id;
      setMessages(res.data.messages);
      setOther(res.data.other);
      setInboxRows(list.data.conversations);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open chat");
      router.push("/inbox");
    } finally {
      setLoading(false);
    }
  }, [otherId, router, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useSocket({
    onMessage: (payload) => {
      const p = payload as { conversationId: string; message: ChatMessage };
      if (p.conversationId === conversationIdRef.current) {
        setMessages((prev) =>
          prev.some((m) => m.id === p.message.id) ? prev : [...prev, p.message],
        );
        if (p.message.senderId !== me?.id && conversationIdRef.current) {
          void chatApi.markRead(conversationIdRef.current).catch(() => undefined);
        }
      }
      void chatApi.list().then((list) => setInboxRows(list.data.conversations)).catch(() => undefined);
    },
    onMessageDeleted: (payload) => {
      const p = payload as { conversationId: string; message: ChatMessage };
      if (p.conversationId === conversationIdRef.current) {
        setMessages((prev) =>
          prev.map((m) => (m.id === p.message.id ? { ...m, ...p.message, deleted: true } : m)),
        );
      }
    },
    onMessageHidden: (payload) => {
      if (payload.conversationId === conversationIdRef.current) {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      }
    },
    onMessageRead: (payload) => {
      if (payload.conversationId !== conversationIdRef.current) return;
      const ids = new Set(payload.messageIds);
      setMessages((prev) =>
        prev.map((m) =>
          ids.has(m.id) ? { ...m, readAt: payload.readAt } : m,
        ),
      );
    },
    onPresence: ({ accountId, isOnline, lastSeenAt }) => {
      if (accountId === otherId) {
        setOther((prev) =>
          prev
            ? {
                ...prev,
                isOnline,
                lastSeenAt: lastSeenAt ?? prev.lastSeenAt,
              }
            : prev,
        );
      }
      setInboxRows((prev) =>
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
  });

  async function deleteMessage(messageId: string, scope: "everyone" | "me") {
    const ok = await confirm({
      title: scope === "me" ? "Delete for me" : "Delete for everyone",
      message:
        scope === "me"
          ? "Remove this message from your chat only. The other expert still sees it."
          : "Delete this message for everyone? It cannot be restored.",
      confirmLabel: scope === "me" ? "Delete for me" : "Delete for everyone",
      cancelLabel: "Keep",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await chatApi.delete(messageId, scope);
      if (res.data.scope === "me") {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        toast.success("Deleted for you");
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === res.data.message.id ? { ...m, ...res.data.message, deleted: true } : m,
          ),
        );
        toast.success("Deleted for everyone");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveMedia(kind: "IMAGE" | "VIDEO", url: string) {
    try {
      await downloadMedia(url, mediaFilename(kind, url));
      toast.success(kind === "IMAGE" ? "Image saved" : "Video saved");
    } catch {
      toast.error("Download failed");
    }
  }

  async function sendText() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await chatApi.send({
        conversationId: conversationId || undefined,
        toAccountId: otherId,
        kind: "TEXT",
        body: text.trim(),
      });
      setConversationId(res.data.conversationId);
      conversationIdRef.current = res.data.conversationId;
      setMessages((prev) => [...prev, res.data.message]);
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendFile(file: File, kind: "IMAGE" | "VIDEO" | "VOICE") {
    if (kind === "IMAGE" && myImages >= IMAGE_CAP) {
      toast.error("You can send at most 5 images in this chat");
      return;
    }
    if (kind === "VIDEO" && myVideos >= VIDEO_CAP) {
      toast.error("You can send at most 3 videos in this chat");
      return;
    }
    setBusy(true);
    try {
      const uploaded = await uploadMedia(file, kind);
      if (kind === "VIDEO" && (uploaded.durationS || 0) > 30) {
        toast.error("Video stops at 30 seconds");
        return;
      }
      const res = await chatApi.send({
        conversationId: conversationId || undefined,
        toAccountId: otherId,
        kind,
        mediaUrl: uploaded.url,
        mediaDurationS: uploaded.durationS,
      });
      setConversationId(res.data.conversationId);
      conversationIdRef.current = res.data.conversationId;
      setMessages((prev) => [...prev, res.data.message]);
      toast.success("Media sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function pickMedia(file: File, kind: "IMAGE" | "VIDEO") {
    if (kind === "IMAGE" && myImages >= IMAGE_CAP) {
      toast.error("You can send at most 5 images in this chat");
      return;
    }
    if (kind === "VIDEO" && myVideos >= VIDEO_CAP) {
      toast.error("You can send at most 3 videos in this chat");
      return;
    }
    setPrepare({ file, kind });
  }

  async function toggleVoice() {
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: mime });
        void sendFile(file, "VOICE");
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      toast.info("Recording… tap again to stop and send. Voice has no 30s cap.");
    } catch {
      toast.error("Microphone permission is required to record voice");
    }
  }

  if (loading) return <Loader full label="Opening chat…" />;

  return (
    <AppShell fullBleed>
      <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden bg-paper">
        <div className="hidden h-full min-h-0 w-[320px] shrink-0 lg:flex">
          <InboxSidebar rows={inboxRows} activeOtherId={otherId} />
        </div>
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-cream">
        {other ? (
          <div className="flex shrink-0 items-center gap-3 border-b border-line px-3 py-2.5 sm:px-4 sm:py-3">
            <Link
              href="/inbox"
              className="rounded-lg border border-line bg-paper px-2 py-1 text-xs font-semibold text-forest lg:hidden"
            >
              ← Chats
            </Link>
            {other.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={other.photoUrl}
                alt={other.name}
                className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm font-bold text-paper sm:h-11 sm:w-11">
                {other.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <strong className="truncate text-sm sm:text-base">{other.name}</strong>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: other.isOnline ? "var(--success)" : "#9aa59c",
                  }}
                />
              </div>
              <p className="truncate text-xs text-muted">
                {formatLastSeen(other.lastSeenAt, other.isOnline)}
                {other.ratingCount > 0
                  ? ` · ★ ${Number(other.rating).toFixed(1)} (${other.ratingCount})`
                  : ""}
              </p>
            </div>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {messages.map((m, idx) => {
            const mine = m.senderId === me?.id;
            const prev = messages[idx - 1];
            const showDay = !prev || !sameChatDay(prev.createdAt, m.createdAt);
            return (
              <div key={m.id}>
                {showDay ? (
                  <p className="mb-2 text-center text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
                    {formatChatDay(m.createdAt)}
                  </p>
                ) : null}
                <div
                  className={`group relative max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "ml-auto bg-forest text-paper" : "bg-paper text-ink"
                  }`}
                >
                  {m.deleted ? (
                    <p className={`italic ${mine ? "text-paper/80" : "text-muted"}`}>
                      This {m.kind.toLowerCase()} message was deleted
                    </p>
                  ) : (
                    <>
                      {m.kind === "TEXT" && <p>{m.body}</p>}
                      {(m.kind === "IMAGE" || m.kind === "VIDEO") && m.mediaUrl ? (
                        <ChatMediaThumb
                          kind={m.kind}
                          url={m.mediaUrl}
                          mine={mine}
                          onOpen={() =>
                            setPreview({ kind: m.kind as "IMAGE" | "VIDEO", url: m.mediaUrl! })
                          }
                          onDownload={() =>
                            void saveMedia(m.kind as "IMAGE" | "VIDEO", m.mediaUrl!)
                          }
                        />
                      ) : null}
                      {m.kind === "VOICE" && m.mediaUrl && (
                        <audio src={m.mediaUrl} controls className="w-full" />
                      )}
                    </>
                  )}
                  <div
                    className={`mt-1 flex items-center gap-2 ${
                      mine ? "justify-end text-paper/70" : "justify-between text-muted"
                    }`}
                  >
                    <span className="text-[0.65rem]">
                      {formatChatTime(m.createdAt)}
                      {mine && !m.deleted ? <ReadTicks read={Boolean(m.readAt)} /> : null}
                    </span>
                    {!m.deleted ? (
                      <span className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void deleteMessage(m.id, "me")}
                          className="text-[0.65rem] font-semibold underline opacity-80 hover:opacity-100 disabled:opacity-40"
                        >
                          Delete for me
                        </button>
                        {mine ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void deleteMessage(m.id, "everyone")}
                            className="text-[0.65rem] font-semibold underline opacity-80 hover:opacity-100 disabled:opacity-40"
                          >
                            For everyone
                          </button>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="grid shrink-0 gap-2 border-t border-line p-3">
          <p className="text-[0.7rem] text-muted">
            Images {myImages}/{IMAGE_CAP} · Videos {myVideos}/{VIDEO_CAP} · Voice unlimited ·
            Video ≤30s · No calls
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-line bg-paper px-3 py-2"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t(lang, "typeMessage")}
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendText();
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void sendText()}
              className="rounded-xl bg-forest px-4 py-2 font-semibold text-paper disabled:opacity-50"
            >
              {busy ? <ButtonLoader /> : t(lang, "send")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 font-semibold">
              Image
              <input
                type="file"
                accept="image/*,.heic,.heif,.avif,.tif,.tiff,.bmp,.gif,.webp,.jfif,.jpg,.jpeg,.png,.svg,.ico,.raw,.dng"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickMedia(f, "IMAGE");
                  e.target.value = "";
                }}
              />
            </label>
            <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 font-semibold">
              Video ≤30s
              <input
                type="file"
                accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.mkv,.mpeg,.mpg,.3gp,.qt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickMedia(f, "VIDEO");
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void toggleVoice()}
              className={`rounded-lg border px-3 py-1.5 font-semibold ${
                recording ? "border-forest bg-mint text-forest" : "border-line"
              }`}
            >
              {recording ? t(lang, "stopRecording") : t(lang, "recordVoice")}
            </button>
          </div>
        </div>
        </div>
      </div>
      {preview ? (
        <MediaLightbox
          kind={preview.kind}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      ) : null}
      {prepare ? (
        <MediaPrepareModal
          file={prepare.file}
          kind={prepare.kind}
          onCancel={() => setPrepare(null)}
          onReady={(file) => {
            const kind = prepare.kind;
            setPrepare(null);
            void sendFile(file, kind);
          }}
        />
      ) : null}
    </AppShell>
  );
}
