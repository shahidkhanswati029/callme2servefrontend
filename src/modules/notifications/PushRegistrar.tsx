"use client";

import { useEffect, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { listenForegroundPush, registerPushToken } from "@/lib/firebase";
import { notificationsApi } from "@/modules/notifications/api";
import { useToast } from "@/shared/toast/ToastProvider";
import { useUiLanguage } from "@/shared/useUiLanguage";

/**
 * Registers FCM device token once per signed-in expert session and
 * surfaces foreground pushes as toasts. Safe no-op when Firebase env is missing.
 */
export function PushRegistrar() {
  const account = useAppSelector((s) => s.session.account);
  const toast = useToast();
  const lang = useUiLanguage();
  const doneRef = useRef(false);

  useEffect(() => {
    if (!account || account.seat === "DESK") return;
    if (doneRef.current) return;

    let cancelled = false;
    let unsub: (() => void) | undefined;

    const run = async () => {
      // Let the shell settle; permission prompt is better after first paint.
      await new Promise((r) => setTimeout(r, 1800));
      if (cancelled) return;
      try {
        const token = await registerPushToken();
        if (cancelled) return;
        if (token) {
          doneRef.current = true;
          await notificationsApi.savePushToken(token, lang);
        }
        unsub = (await listenForegroundPush((title, body) => {
          if (title || body) toast.info(`${title}${body ? `: ${body}` : ""}`);
        })) as (() => void) | undefined;
      } catch {
        // Firebase optional — sockets still deliver in-app alerts.
      }
    };

    void run();
    return () => {
      cancelled = true;
      if (typeof unsub === "function") unsub();
    };
  }, [account, lang, toast]);

  return null;
}
