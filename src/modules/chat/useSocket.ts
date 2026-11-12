"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/token";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Handlers = {
  onMessage?: (payload: unknown) => void;
  onMessageDeleted?: (payload: unknown) => void;
  onMessageRead?: (payload: {
    conversationId: string;
    messageIds: string[];
    readAt: string;
  }) => void;
  onMessageHidden?: (payload: { conversationId: string; messageId: string }) => void;
  onNotification?: (payload: unknown) => void;
  onPresence?: (payload: {
    accountId: string;
    isOnline: boolean;
    lastSeenAt?: string | null;
  }) => void;
};

/** Stable socket — handlers live in a ref so presence stays connected. */
export function useSocket(handlers: Handlers = {}) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let cancelled = false;
    let socket: Socket | null = null;
    let retryId: number | undefined;

    function bind(s: Socket) {
      s.on("message:new", (payload) => handlersRef.current.onMessage?.(payload));
      s.on("message:deleted", (payload) =>
        handlersRef.current.onMessageDeleted?.(payload),
      );
      s.on("message:read", (payload) =>
        handlersRef.current.onMessageRead?.(
          payload as {
            conversationId: string;
            messageIds: string[];
            readAt: string;
          },
        ),
      );
      s.on("message:hidden", (payload) =>
        handlersRef.current.onMessageHidden?.(
          payload as { conversationId: string; messageId: string },
        ),
      );
      s.on("notification:new", (payload) =>
        handlersRef.current.onNotification?.(payload),
      );
      s.on("presence:update", (payload) =>
        handlersRef.current.onPresence?.(
          payload as {
            accountId: string;
            isOnline: boolean;
            lastSeenAt?: string | null;
          },
        ),
      );
    }

    function connect(): boolean {
      if (cancelled || socket) return Boolean(socket);
      const token = getAccessToken();
      if (!token) return false;
      socket = io(API_URL, {
        auth: { token },
        withCredentials: true,
        transports: ["websocket", "polling"],
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
      }, 10000);
    }

    return () => {
      cancelled = true;
      if (retryId) window.clearInterval(retryId);
      socket?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef;
}
