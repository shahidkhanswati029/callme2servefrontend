"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";
import { useAppSelector } from "@/store/hooks";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type NotificationHandler = (payload: unknown) => void;
type MessageHandler = (payload: unknown) => void;
type PresenceHandler = (payload: {
  accountId: string;
  isOnline: boolean;
  lastSeenAt?: string | null;
}) => void;
type MessageReadHandler = (payload: {
  conversationId: string;
  messageIds: string[];
  readAt: string;
}) => void;
type MessageHiddenHandler = (payload: {
  conversationId: string;
  messageId: string;
}) => void;

type HandlerSet = {
  onMessage: Set<MessageHandler>;
  onMessageDeleted: Set<MessageHandler>;
  onMessageRead: Set<MessageReadHandler>;
  onMessageHidden: Set<MessageHiddenHandler>;
  onNotification: Set<NotificationHandler>;
  onPresence: Set<PresenceHandler>;
};

type SocketContextValue = {
  socketRef: MutableRefObject<Socket | null>;
  subscribe: (handlers: {
    onMessage?: MessageHandler;
    onMessageDeleted?: MessageHandler;
    onMessageRead?: MessageReadHandler;
    onMessageHidden?: MessageHiddenHandler;
    onNotification?: NotificationHandler;
    onPresence?: PresenceHandler;
  }) => () => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const accountId = useAppSelector((s) => s.session.account?.id);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<HandlerSet>({
    onMessage: new Set(),
    onMessageDeleted: new Set(),
    onMessageRead: new Set(),
    onMessageHidden: new Set(),
    onNotification: new Set(),
    onPresence: new Set(),
  });

  useEffect(() => {
    if (!accountId) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    let cancelled = false;
    let retryId: number | undefined;
    let socket: Socket | null = null;

    function bind(s: Socket) {
      s.on("message:new", (payload) => {
        handlersRef.current.onMessage.forEach((fn) => fn(payload));
      });
      s.on("message:deleted", (payload) => {
        handlersRef.current.onMessageDeleted.forEach((fn) => fn(payload));
      });
      s.on("message:read", (payload) => {
        handlersRef.current.onMessageRead.forEach((fn) =>
          fn(
            payload as {
              conversationId: string;
              messageIds: string[];
              readAt: string;
            },
          ),
        );
      });
      s.on("message:hidden", (payload) => {
        handlersRef.current.onMessageHidden.forEach((fn) =>
          fn(payload as { conversationId: string; messageId: string }),
        );
      });
      s.on("notification:new", (payload) => {
        handlersRef.current.onNotification.forEach((fn) => fn(payload));
      });
      s.on("presence:update", (payload) => {
        handlersRef.current.onPresence.forEach((fn) =>
          fn(
            payload as {
              accountId: string;
              isOnline: boolean;
              lastSeenAt?: string | null;
            },
          ),
        );
      });
    }

    function connect(): boolean {
      if (cancelled || socket) return Boolean(socket);
      const token = getAccessToken();
      if (!token) return false;
      socket = io(API_URL, {
        auth: { token },
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 800,
        reconnectionDelayMax: 5000,
      });
      socketRef.current = socket;
      bind(socket);
      return true;
    }

    if (!connect()) {
      retryId = window.setInterval(() => {
        if (connect() && retryId) window.clearInterval(retryId);
      }, 700);
      window.setTimeout(() => {
        if (retryId) window.clearInterval(retryId);
      }, 12000);
    }

    return () => {
      cancelled = true;
      if (retryId) window.clearInterval(retryId);
      socket?.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [accountId]);

  const valueRef = useRef<SocketContextValue | null>(null);
  if (!valueRef.current) {
    valueRef.current = {
      socketRef,
      subscribe(handlers) {
        const sets = handlersRef.current;
        if (handlers.onMessage) sets.onMessage.add(handlers.onMessage);
        if (handlers.onMessageDeleted) sets.onMessageDeleted.add(handlers.onMessageDeleted);
        if (handlers.onMessageRead) sets.onMessageRead.add(handlers.onMessageRead);
        if (handlers.onMessageHidden) sets.onMessageHidden.add(handlers.onMessageHidden);
        if (handlers.onNotification) sets.onNotification.add(handlers.onNotification);
        if (handlers.onPresence) sets.onPresence.add(handlers.onPresence);
        return () => {
          if (handlers.onMessage) sets.onMessage.delete(handlers.onMessage);
          if (handlers.onMessageDeleted) sets.onMessageDeleted.delete(handlers.onMessageDeleted);
          if (handlers.onMessageRead) sets.onMessageRead.delete(handlers.onMessageRead);
          if (handlers.onMessageHidden) sets.onMessageHidden.delete(handlers.onMessageHidden);
          if (handlers.onNotification) sets.onNotification.delete(handlers.onNotification);
          if (handlers.onPresence) sets.onPresence.delete(handlers.onPresence);
        };
      },
    };
  }

  return (
    <SocketContext.Provider value={valueRef.current}>{children}</SocketContext.Provider>
  );
}

/** Stable shared socket — handlers subscribe without reconnecting on every page. */
export function useSocket(handlers: {
  onMessage?: MessageHandler;
  onMessageDeleted?: MessageHandler;
  onMessageRead?: MessageReadHandler;
  onMessageHidden?: MessageHiddenHandler;
  onNotification?: NotificationHandler;
  onPresence?: PresenceHandler;
} = {}) {
  const ctx = useContext(SocketContext);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe({
      onMessage: (p) => handlersRef.current.onMessage?.(p),
      onMessageDeleted: (p) => handlersRef.current.onMessageDeleted?.(p),
      onMessageRead: (p) => handlersRef.current.onMessageRead?.(p),
      onMessageHidden: (p) => handlersRef.current.onMessageHidden?.(p),
      onNotification: (p) => handlersRef.current.onNotification?.(p),
      onPresence: (p) => handlersRef.current.onPresence?.(p),
    });
  }, [ctx]);

  return ctx?.socketRef ?? { current: null };
}
