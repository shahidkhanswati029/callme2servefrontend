"use client";

import { useCallback, useEffect, useState } from "react";
import { t } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Soft animated banner when the browser is offline or the API health check fails.
 * Does not block the app — only warns.
 */
export function OfflineBanner() {
  const lang = useUiLanguage();
  const [offline, setOffline] = useState(false);
  const [apiDown, setApiDown] = useState(false);
  const [visible, setVisible] = useState(false);

  const checkApi = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOffline(true);
      setApiDown(false);
      setVisible(true);
      return;
    }
    setOffline(false);
    try {
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${API_URL}/api/health`, {
        method: "GET",
        cache: "no-store",
        signal: ctrl.signal,
      });
      window.clearTimeout(timer);
      const down = !res.ok;
      setApiDown(down);
      setVisible(down);
    } catch {
      setApiDown(true);
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    void checkApi();
    const onOnline = () => void checkApi();
    const onOffline = () => {
      setOffline(true);
      setApiDown(false);
      setVisible(true);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const id = window.setInterval(() => void checkApi(), 30000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(id);
    };
  }, [checkApi]);

  if (!visible) return null;

  const title = offline ? t(lang, "youAreOffline") : t(lang, "serverUnreachable");
  const lede = offline ? t(lang, "youAreOfflineLede") : t(lang, "serverUnreachableLede");

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-drawer fixed inset-x-0 top-0 z-[80] flex justify-center px-3 pt-3 pointer-events-none"
    >
      <div className="pointer-events-auto flex max-w-xl items-start gap-3 rounded-2xl border border-line bg-cream px-4 py-3 shadow-[0_16px_40px_rgba(26,40,34,0.18)]">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-forest text-sm font-bold text-paper">
          !
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">{title}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted">{lede}</p>
        </div>
        <button
          type="button"
          className="cmts-press shrink-0 rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-paper"
          onClick={() => void checkApi()}
        >
          {t(lang, "retry")}
        </button>
        <button
          type="button"
          className="cmts-press shrink-0 rounded-lg border border-line bg-paper px-2 py-1.5 text-xs font-semibold text-muted"
          aria-label={t(lang, "dismiss")}
          onClick={() => setVisible(false)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
