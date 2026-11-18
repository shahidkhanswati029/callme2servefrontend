"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAccount } from "@/store/slices/sessionSlice";
import { ButtonLoader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";
import { useConfirm } from "@/shared/confirm/ConfirmProvider";
import { getUiLanguageOptions, t, type UiLanguage } from "@/shared/i18n";
import { setUiLanguage as setUiLanguagePref } from "@/store/slices/uiPrefsSlice";
import { getAccessToken } from "@/lib/token";
import { useUiLanguage } from "@/shared/useUiLanguage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LanguageSettingsPage() {
  return (
    <RequireAuth seat="EXPERT">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const account = useAppSelector((s) => s.session.account)!;
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { confirm } = useConfirm();
  const lang = useUiLanguage();
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>(lang);
  const [manual, setManual] = useState(account.languages.join(", "));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUiLanguage(lang);
  }, [lang]);
  const presets = useMemo(
    () => ["Urdu", "English", "Punjabi", "Arabic", "Persian", "Japanese", "Sindhi", "Pashto"],
    [],
  );

  function pickLanguage(code: UiLanguage) {
    setUiLanguage(code);
    // Apply instantly across the whole app.
    dispatch(setUiLanguagePref(code));
  }

  async function save() {
    const ok = await confirm({
      title: t(lang, "language"),
      message: t(lang, "saveLanguageConfirm"),
      confirmLabel: t(lang, "save"),
      cancelLabel: t(lang, "cancel"),
    });
    if (!ok) return;
    setBusy(true);
    try {
      const languages = manual
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/api/language`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ uiLanguage, languages }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || json.message || t(lang, "saveFailed"));
      }
      dispatch(setAccount(json.data.account));
      dispatch(setUiLanguagePref(uiLanguage));
      toast.success(t(lang, "languageSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t(lang, "saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title={t(lang, "language")}>
      <p className="mb-4 text-sm text-muted">{t(lang, "languagePageLede")}</p>

      <div className="grid gap-3">
        <p className="text-sm font-semibold">{t(lang, "appLanguage")}</p>
        <div className="flex flex-wrap gap-2">
          {getUiLanguageOptions(lang).map((o) => (
            <button
              key={o.code}
              type="button"
              onClick={() => pickLanguage(o.code)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                uiLanguage === o.code
                  ? "bg-forest text-paper"
                  : "border border-line bg-cream"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-semibold">{t(lang, "languagesYouSpeak")}</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const on = manual
              .split(",")
              .map((s) => s.trim().toLowerCase())
              .includes(p.toLowerCase());
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  const parts = manual
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  if (on) setManual(parts.filter((x) => x.toLowerCase() !== p.toLowerCase()).join(", "));
                  else setManual([...parts, p].join(", "));
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  on ? "bg-mint text-forest" : "border border-line bg-cream"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
        <label className="grid gap-1 text-sm font-semibold">
          {t(lang, "orWriteManually")}
          <input
            className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Urdu, English, Punjabi"
          />
        </label>

        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="mt-2 rounded-xl bg-forest px-4 py-3 font-semibold text-paper disabled:opacity-50"
        >
          {busy ? <ButtonLoader /> : t(lang, "saveLanguage")}
        </button>
      </div>
    </AppShell>
  );
}
