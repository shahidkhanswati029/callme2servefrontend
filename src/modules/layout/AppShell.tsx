"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signOut } from "@/store/slices/sessionSlice";
import {
  toggleSidebar,
  toggleTheme,
  setUiLanguage,
  setCountry,
  setCurrency,
} from "@/store/slices/uiPrefsSlice";
import { useToast } from "@/shared/toast/ToastProvider";
import { ButtonLoader } from "@/shared/ui/Loader";
import { t, UI_LANGUAGE_OPTIONS, type UiLanguage } from "@/shared/i18n";
import { listCountries } from "@/shared/countries";
import { notificationsApi } from "@/modules/notifications/api";
import { useSocket } from "@/modules/chat/useSocket";

const expertHrefs = [
  { href: "/home", key: "home" },
  { href: "/inbox", key: "message" },
  { href: "/notifications", key: "notifications" },
  { href: "/jobs", key: "jobs" },
  { href: "/shops", key: "shops" },
  { href: "/settings/place", key: "place" },
  { href: "/earnings", key: "earnings" },
  { href: "/refer", key: "refer" },
  { href: "/alarms", key: "alarms" },
  { href: "/account", key: "me" },
] as const;

const deskHrefs = [
  { href: "/desk", key: "board" },
  { href: "/desk/activity", key: "live" },
  { href: "/desk/contacts", key: "contact" },
  { href: "/desk/jobs", key: "jobs" },
  { href: "/desk/money", key: "money" },
  { href: "/desk/experts", key: "experts" },
  { href: "/desk/shops", key: "shops" },
  { href: "/desk/income", key: "income" },
  { href: "/account", key: "me" },
] as const;

function localeFor(lang: UiLanguage) {
  if (lang === "ur") return "ur-PK";
  if (lang === "pa") return "pa-PK";
  if (lang === "ar") return "ar";
  if (lang === "fa") return "fa";
  if (lang === "ja") return "ja-JP";
  return "en";
}

function isActive(pathname: string, href: string) {
  if (href === "/desk") return pathname === "/desk";
  if (href === "/home") return pathname === "/home";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  title,
  fullBleed,
}: {
  children: React.ReactNode;
  title?: string;
  fullBleed?: boolean;
}) {
  const pathname = usePathname();
  const account = useAppSelector((s) => s.session.account);
  const authBusy = useAppSelector((s) => s.session.authBusy);
  const sidebarOpen = useAppSelector((s) => s.uiPrefs.sidebarOpen);
  const theme = useAppSelector((s) => s.uiPrefs.theme);
  const uiLang = useAppSelector((s) => s.uiPrefs.language);
  const countryCode = useAppSelector((s) => s.uiPrefs.countryCode);
  const currency = useAppSelector((s) => s.uiPrefs.currency);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const lang = (account?.uiLanguage || uiLang || "en") as UiLanguage;
  const isDesk = account?.seat === "DESK";
  const [unread, setUnread] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const countries = useMemo(() => listCountries(), []);
  const currencies = useMemo(() => {
    const set = new Set(countries.map((c) => c.currency).filter(Boolean));
    return Array.from(set).sort();
  }, [countries]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!account || isDesk) return;
    let cancelled = false;
    void notificationsApi
      .list(1, 1)
      .then((res) => {
        if (!cancelled) setUnread(res.data.unread || 0);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [account, isDesk, pathname]);

  useSocket({
    onNotification: () => {
      setUnread((n) => n + 1);
    },
  });

  const mobileLinks = isDesk
    ? [
        { href: "/desk", label: t(lang, "board") },
        { href: "/desk/activity", label: t(lang, "live") },
        { href: "/desk/contacts", label: t(lang, "contact") },
        { href: "/desk/money", label: t(lang, "money") },
        { href: "/account", label: t(lang, "me") },
      ]
    : [
        { href: "/home", label: t(lang, "home") },
        { href: "/inbox", label: t(lang, "message") },
        { href: "/notifications", label: t(lang, "notifications") },
        { href: "/jobs", label: t(lang, "jobs") },
        { href: "/shops", label: t(lang, "shops") },
        { href: "/account", label: t(lang, "me") },
      ];

  const gridCols =
    sidebarOpen && !fullBleed
      ? "lg:grid-cols-[240px_1fr]"
      : sidebarOpen
        ? "lg:grid-cols-[240px_1fr]"
        : "lg:grid-cols-[0px_1fr]";

  return (
    <div
      className={`grid min-h-[100dvh] bg-paper lg:h-[100dvh] lg:overflow-hidden ${gridCols}`}
    >
      <aside
        className={`hidden min-h-0 flex-col overflow-y-auto bg-[var(--sidebar)] p-5 text-paper transition-all lg:flex ${
          sidebarOpen ? "opacity-100" : "pointer-events-none w-0 overflow-hidden p-0 opacity-0"
        }`}
      >
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass">
            {isDesk ? "SUPER ADMIN" : account?.package || "EXPERT"}
          </p>
          <h1 className="font-display mt-2 text-2xl font-bold">CallMe2Serve</h1>
          <p className="mt-2 text-sm text-[var(--sidebar-text)]">
            {account?.name}
            {account?.isOnline ? ` · ${t(lang, "online")}` : ""}
          </p>
        </div>

        <nav className="mt-8 grid flex-1 content-start gap-2">
          {isDesk
            ? deskHrefs.map((l) => {
                const active = isActive(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`rounded-xl px-3 py-2.5 font-semibold transition-colors ${
                      active
                        ? "bg-[#14332b] text-paper"
                        : "text-[var(--sidebar-text)] hover:bg-[#14332b]/60"
                    }`}
                  >
                    {t(lang, l.key)}
                  </Link>
                );
              })
            : expertHrefs.map((l) => {
                const active = isActive(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`relative rounded-xl px-3 py-2.5 font-semibold transition-colors ${
                      active
                        ? "bg-[#14332b] text-paper"
                        : "text-[var(--sidebar-text)] hover:bg-[#14332b]/60"
                    }`}
                  >
                    {t(lang, l.key)}
                    {l.key === "notifications" && unread > 0 ? (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-brass px-1.5 text-[0.65rem] font-bold text-forest">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
        </nav>

        <button
          type="button"
          disabled={authBusy}
          className="mt-auto rounded-xl border border-white/20 px-3 py-2.5 text-left text-sm font-semibold text-[var(--sidebar-text)] disabled:opacity-50"
          onClick={async () => {
            await dispatch(signOut());
            toast.info("Signed out");
            router.push("/");
          }}
        >
          {authBusy ? (
            <span className="inline-flex items-center gap-2">
              <ButtonLoader /> …
            </span>
          ) : (
            t(lang, "signOut")
          )}
        </button>
      </aside>

      <div
        className={
          fullBleed
            ? "flex h-[100dvh] min-h-0 min-w-0 flex-col overflow-hidden pb-[3.5rem] lg:h-full lg:pb-0"
            : "mx-auto min-h-0 w-full max-w-[1100px] overflow-y-auto px-4 pb-24 pt-4 lg:px-8 lg:pb-8 lg:pt-5"
        }
      >
        {fullBleed ? (
          <div className="flex shrink-0 items-center gap-2 border-b border-line bg-cream px-3 py-2 lg:px-4">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push(isDesk ? "/desk" : "/inbox");
                }
              }}
              className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold"
            >
              ← {t(lang, "back")}
            </button>
            {title ? <span className="truncate text-sm font-semibold">{title}</span> : null}
          </div>
        ) : null}
        {!fullBleed ? (
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push(isDesk ? "/desk" : "/home");
                  }
                }}
                className="rounded-xl border border-line bg-cream px-3 py-2 text-xs font-semibold"
                aria-label={t(lang, "back")}
              >
                ← {t(lang, "back")}
              </button>
              <button
                type="button"
                onClick={() => dispatch(toggleSidebar())}
                className="hidden rounded-xl border border-line bg-cream px-3 py-2 text-xs font-semibold lg:inline-flex"
                aria-label={sidebarOpen ? t(lang, "hideMenu") : t(lang, "showMenu")}
              >
                {sidebarOpen ? t(lang, "hideMenu") : t(lang, "showMenu")}
              </button>
              {title ? (
                <h2 className="font-display truncate text-2xl font-bold text-ink">{title}</h2>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <time className="rounded-xl border border-line bg-cream px-3 py-2 text-xs font-semibold text-muted">
                {now.toLocaleString(localeFor(lang), {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              <select
                className="rounded-xl border border-line bg-cream px-2 py-2 text-xs font-semibold"
                value={uiLang}
                aria-label={t(lang, "language")}
                onChange={(e) => dispatch(setUiLanguage(e.target.value as UiLanguage))}
              >
                {UI_LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                className="max-w-[7.5rem] rounded-xl border border-line bg-cream px-2 py-2 text-xs font-semibold"
                value={countryCode}
                aria-label="Country"
                onChange={(e) => dispatch(setCountry(e.target.value))}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-line bg-cream px-2 py-2 text-xs font-semibold"
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
                className="rounded-xl border border-line bg-cream px-3 py-2 text-xs font-semibold"
              >
                {theme === "light" ? t(lang, "dark") : t(lang, "light")}
              </button>
            </div>
          </header>
        ) : null}
        {children}
      </div>

      <nav
        className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-cream/95 py-2 backdrop-blur lg:hidden ${
          isDesk ? "grid-cols-5" : "grid-cols-6"
        }`}
      >
        {mobileLinks.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`relative px-1 text-center text-[0.65rem] font-semibold ${
                active ? "text-forest" : "text-muted"
              }`}
            >
              {l.label}
              {l.href === "/notifications" && unread > 0 ? (
                <span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-brass" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
