"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/modules/identity/components/BrandMark";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setCountry,
  setCurrency,
  setUiLanguage,
  toggleTheme,
} from "@/store/slices/uiPrefsSlice";
import { getUiLanguageOptions, t, type UiLanguage } from "@/shared/i18n";
import { listCountries } from "@/shared/countries";

export function SiteHeader({ supportBanner = true }: { supportBanner?: boolean }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const language = useAppSelector((s) => s.uiPrefs.language);
  const theme = useAppSelector((s) => s.uiPrefs.theme);
  const countryCode = useAppSelector((s) => s.uiPrefs.countryCode);
  const currency = useAppSelector((s) => s.uiPrefs.currency);
  const [menuOpen, setMenuOpen] = useState(false);

  const countries = useMemo(() => listCountries(language), [language]);
  const languageOptions = useMemo(() => getUiLanguageOptions(language), [language]);
  const currencies = useMemo(() => {
    const set = new Set(countries.map((c) => c.currency).filter(Boolean));
    return Array.from(set).sort();
  }, [countries]);

  const primaryNav = [
    { href: "/", label: t(language, "home"), always: true },
    { href: "/categories", label: t(language, "categories"), always: true },
    { href: "/search", label: t(language, "findExperts"), always: true },
    { href: "/cities", label: t(language, "cities"), always: true },
    { href: "/how-it-works", label: t(language, "howItWorks"), always: false },
    { href: "/faq", label: t(language, "faq"), always: false },
    { href: "/about", label: t(language, "about"), always: false },
    { href: "/contact", label: t(language, "contact"), always: false },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6">
          <Link href="/" className="shrink-0">
            <BrandMark compact />
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center gap-x-2.5 overflow-x-auto whitespace-nowrap text-[0.75rem] font-semibold text-muted [scrollbar-width:none] lg:flex xl:gap-x-3.5 xl:text-[0.8rem] [&::-webkit-scrollbar]:hidden"
            aria-label={t(language, "home")}
          >
            {primaryNav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`cmts-nav-link shrink-0 transition-colors duration-200 ${
                    n.always ? "" : "hidden xl:inline"
                  } ${active ? "is-active text-forest" : "hover:text-forest"}`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-1.5 border-s border-line ps-3 lg:flex xl:gap-2">
            <select
              className="max-w-[8.5rem] rounded-lg border border-line bg-paper px-2 py-1.5 text-[0.7rem] font-semibold xl:max-w-[9.5rem] xl:rounded-xl xl:text-xs"
              value={language}
              aria-label={t(language, "language")}
              onChange={(e) => dispatch(setUiLanguage(e.target.value as UiLanguage))}
            >
              {languageOptions.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="min-w-[9rem] max-w-[13rem] rounded-lg border border-line bg-paper px-2 py-1.5 text-[0.7rem] font-semibold xl:min-w-[10rem] xl:max-w-[15rem] xl:rounded-xl xl:text-xs"
              value={countryCode}
              aria-label={t(language, "country")}
              onChange={(e) => dispatch(setCountry(e.target.value))}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-line bg-paper px-2 py-1.5 text-[0.7rem] font-semibold xl:rounded-xl xl:text-xs"
              value={currency}
              aria-label={t(language, "currencyLabel")}
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
              className="cmts-press rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[0.7rem] font-semibold transition-colors duration-200 xl:rounded-xl xl:px-3 xl:text-xs"
            >
              {theme === "light" ? t(language, "dark") : t(language, "light")}
            </button>
            <Link
              href="/login"
              className="cmts-press rounded-lg bg-forest px-3.5 py-1.5 text-xs font-semibold text-paper transition-opacity duration-200 hover:opacity-90 xl:rounded-xl xl:px-4 xl:py-2 xl:text-sm"
            >
              {t(language, "login")}
            </Link>
          </div>

          <button
            type="button"
            className="relative z-50 ms-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-paper lg:hidden"
            aria-label={menuOpen ? t(language, "hideMenu") : t(language, "showMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">
              {menuOpen ? t(language, "close") : t(language, "menu")}
            </span>
            <span className="flex w-5 flex-col gap-[5px]" aria-hidden>
              <span
                className={`block h-[2px] w-full rounded-full bg-forest transition duration-200 ${
                  menuOpen ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-[2px] w-full rounded-full bg-forest transition duration-200 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-[2px] w-full rounded-full bg-forest transition duration-200 ${
                  menuOpen ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>

        {menuOpen ? (
          <div className="animate-drawer border-t border-line px-4 py-3 lg:hidden sm:px-6">
            <div className="mx-auto grid max-w-6xl gap-3">
              <nav className="grid gap-1 text-sm font-semibold text-muted">
                {primaryNav.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`rounded-lg px-3 py-2 transition-colors duration-200 ${
                      pathname === n.href
                        ? "bg-mint text-forest"
                        : "hover:bg-paper hover:text-forest"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>

              <div className="grid gap-2 border-t border-line pt-3 sm:grid-cols-2">
                <select
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold"
                  value={language}
                  aria-label={t(language, "language")}
                  onChange={(e) => dispatch(setUiLanguage(e.target.value as UiLanguage))}
                >
                  {languageOptions.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold"
                  value={countryCode}
                  aria-label={t(language, "country")}
                  onChange={(e) => dispatch(setCountry(e.target.value))}
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold"
                  value={currency}
                  aria-label={t(language, "currencyLabel")}
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
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold"
                >
                  {theme === "light" ? t(language, "dark") : t(language, "light")}
                </button>
              </div>

              <Link
                href="/login"
                className="rounded-xl bg-forest px-4 py-2 text-center text-sm font-semibold text-paper"
                onClick={() => setMenuOpen(false)}
              >
                {t(language, "login")}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
