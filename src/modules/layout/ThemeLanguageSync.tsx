"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateUiPrefs,
  setCountry,
  setCurrency,
  setUiLanguage,
} from "@/store/slices/uiPrefsSlice";
import { identityApi } from "@/modules/identity/api";
import { setAccount } from "@/store/slices/sessionSlice";
import { isRtl, isUiLanguage } from "@/shared/i18n";

/** Applies Redux theme/language/country to <html> and keeps account prefs in sync. */
export function ThemeLanguageSync() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.uiPrefs.theme);
  const language = useAppSelector((s) => s.uiPrefs.language);
  const countryCode = useAppSelector((s) => s.uiPrefs.countryCode);
  const currency = useAppSelector((s) => s.uiPrefs.currency);
  const hydrated = useAppSelector((s) => s.uiPrefs.hydrated);
  const account = useAppSelector((s) => s.session.account);
  const skipLang = useRef(false);
  const skipLocale = useRef(false);
  const seededAccountId = useRef<string | null>(null);

  useEffect(() => {
    dispatch(hydrateUiPrefs());
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl(language) ? "rtl" : "ltr";
    // English (and Japanese) must never stay stuck in RTL from a previous language.
    if (!isRtl(language)) {
      document.documentElement.removeAttribute("dir");
      document.documentElement.dir = "ltr";
    }
  }, [language, hydrated]);

  // Seed Redux from account only once per login — never overwrite an active language change.
  useEffect(() => {
    if (!account) {
      seededAccountId.current = null;
      return;
    }
    if (seededAccountId.current === account.id) return;
    seededAccountId.current = account.id;

    const storedLang =
      typeof window !== "undefined"
        ? (() => {
            try {
              const raw = localStorage.getItem("cmts_ui_prefs");
              const parsed = raw ? (JSON.parse(raw) as { language?: string }) : null;
              return parsed?.language && isUiLanguage(parsed.language) ? parsed.language : null;
            } catch {
              return null;
            }
          })()
        : null;

    // Prefer persisted UI language; else account language.
    if (storedLang) {
      skipLang.current = true;
      dispatch(setUiLanguage(storedLang));
    } else if (account.uiLanguage && isUiLanguage(account.uiLanguage)) {
      skipLang.current = true;
      dispatch(setUiLanguage(account.uiLanguage));
    }

    if (account.country) {
      skipLocale.current = true;
      dispatch(setCountry(account.country));
    } else if (account.currency) {
      skipLocale.current = true;
      dispatch(setCurrency(account.currency));
    }
  }, [account, dispatch]);

  // Push language to account whenever Redux language changes.
  useEffect(() => {
    if (!account || !hydrated) return;
    if (skipLang.current) {
      skipLang.current = false;
      return;
    }
    if (account.uiLanguage === language) return;
    let cancelled = false;
    void identityApi
      .patchPrefs({ uiLanguage: language })
      .then((res) => {
        if (cancelled || !res?.data?.account) return;
        dispatch(setAccount(res.data.account));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [account, language, hydrated, dispatch]);

  // Push country/currency to account (dashboards use account.currency).
  useEffect(() => {
    if (!account || !hydrated) return;
    if (skipLocale.current) {
      skipLocale.current = false;
      return;
    }
    if (account.country === countryCode && account.currency === currency) return;
    let cancelled = false;
    void identityApi
      .patchPrefs({ country: countryCode, currency })
      .then((res) => {
        if (cancelled || !res?.data?.account) return;
        dispatch(setAccount(res.data.account));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [account, countryCode, currency, hydrated, dispatch]);

  return null;
}
