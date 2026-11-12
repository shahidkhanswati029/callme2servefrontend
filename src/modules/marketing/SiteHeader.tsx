"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { BrandMark } from "@/modules/identity/components/BrandMark";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setCountry,
  setCurrency,
  setUiLanguage,
  toggleTheme,
} from "@/store/slices/uiPrefsSlice";
import { t, UI_LANGUAGE_OPTIONS, type UiLanguage } from "@/shared/i18n";
import { listCountries } from "@/shared/countries";

export function SiteHeader({ supportBanner = true }: { supportBanner?: boolean }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const language = useAppSelector((s) => s.uiPrefs.language);
  const theme = useAppSelector((s) => s.uiPrefs.theme);
  const countryCode = useAppSelector((s) => s.uiPrefs.countryCode);
  const currency = useAppSelector((s) => s.uiPrefs.currency);

  const countries = useMemo(() => listCountries(), []);
  const currencies = useMemo(() => {
    const set = new Set(countries.map((c) => c.currency).filter(Boolean));
    return Array.from(set).sort();
  }, [countries]);

  const NAV = [
    { href: "/", label: t(language, "home") },
    { href: "/categories", label: t(language, "categories") },
    { href: "/search", label: t(language, "findExperts") },
    { href: "/cities", label: t(language, "cities") },
    { href: "/how-it-works", label: t(language, "howItWorks") },
    { href: "/faq", label: t(language, "faq") },
    { href: "/about", label: t(language, "about") },
    { href: "/contact", label: t(language, "contact") },
  ];

  return (
    <header className="sticky top-0 z-40">
      {supportBanner ? (
        <div className="bg-forest px-4 py-1.5 text-center text-[0.7rem] font-semibold text-paper sm:text-xs">
          {t(language, "supportBanner")}{" "}
          <Link href="/contact" className="underline decoration-brass underline-offset-2">
            {t(language, "contact")}
          </Link>
        </div>
      ) : null}
      <div className="border-b border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="shrink-0">
            <BrandMark compact />
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-semibold text-muted xl:flex">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={active ? "text-forest" : "hover:text-forest"}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold"
            >
              {t(language, "account")}
            </Link>
            <select
              className="max-w-[8.5rem] rounded-xl border border-line bg-paper px-2 py-2 text-xs font-semibold"
              value={language}
              aria-label={t(language, "language")}
              onChange={(e) => dispatch(setUiLanguage(e.target.value as UiLanguage))}
            >
              {UI_LANGUAGE_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="max-w-[9rem] rounded-xl border border-line bg-paper px-2 py-2 text-xs font-semibold"
              value={countryCode}
              aria-label="Country"
              onChange={(e) => dispatch(setCountry(e.target.value))}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-line bg-paper px-2 py-2 text-xs font-semibold"
              value={currency}
              aria-label="Currency"
              onChange={(e) => dispatch(setCurrency(e.target.value))}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold"
            >
              {theme === "light" ? t(language, "dark") : t(language, "light")}
            </button>
            <Link
              href="/login"
              className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper"
            >
              {t(language, "login")}
            </Link>
          </div>
        </div>
        <nav className="flex gap-3 overflow-x-auto border-t border-line px-4 py-2 text-xs font-semibold text-muted xl:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={pathname === n.href ? "text-forest" : "whitespace-nowrap"}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
