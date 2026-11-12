"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { t } from "@/shared/i18n";

const KEY = "cmts_cookie_consent";

export function CookieConsent() {
  const language = useAppSelector((s) => s.uiPrefs.language);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v !== "allow" && v !== "deny") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const choose = useCallback((value: "allow" | "deny") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-4 sm:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-line bg-cream p-4 shadow-[0_16px_40px_rgba(26,40,34,0.22)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-bold text-ink">{t(language, "cookieTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t(language, "cookieBody")}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("deny")}
            className="rounded-xl border border-line bg-paper px-4 py-2 text-sm font-semibold"
          >
            {t(language, "cookieDeny")}
          </button>
          <button
            type="button"
            onClick={() => choose("allow")}
            className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper"
          >
            {t(language, "cookieAllow")}
          </button>
        </div>
      </div>
    </div>
  );
}
