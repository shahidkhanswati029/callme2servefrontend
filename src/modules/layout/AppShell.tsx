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
import { getUiLanguageOptions, isUiLanguage, t, type UiLanguage } from "@/shared/i18n";
import { listCountries } from "@/shared/countries";
import { notificationsApi } from "@/modules/notifications/api";
import { useSocket } from "@/modules/chat/useSocket";

const expertHrefs = [
  { href: "/home", key: "home" },
  { href: "/inbox", key: "message" },
  { href: "/notifications", key: "notifications" },
  { href: "/quotations", key: "quotations" },
  { href: "/jobs", key: "jobs" },
  { href: "/portfolio", key: "portfolio" },
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
  const lang = (isUiLanguage(uiLang) ? uiLang : "en") as UiLanguage;
  const isDesk = account?.seat === "DESK";
  const [unread, setUnread] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const countries = useMemo(() => listCountries(), []);
  const languageOptions = useMemo(() => getUiLanguageOptions(lang), [lang]);
  const currencies = useMemo(() => {
    const set = new Set(countries.map((c) => c.currency).filter(Boolean));
    return Array.from(set).sort();
  }, [countries]);

  const navLinks = isDesk ? deskHrefs : expertHrefs;

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Only lock document scroll on small screens (mobile chat / drawer).
    // Desktop chat must keep normal layout behavior.
    const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
    if (!mobileMenuOpen && !(fullBleed && mobile)) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [mobileMenuOpen, fullBleed]);

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
    onNotification: (payload) => {
      const n = payload as { title?: string; body?: string };
      setUnread((u) => u + 1);
      void notificationsApi
        .list(1, 1)
        .then((res) => setUnread(res.data.unread || 0))
        .catch(() => undefined);
      if (pathname !== "/notifications" && (n.title || n.body)) {
        toast.info(`${n.title || "Notice"}${n.body ? `: ${n.body}` : ""}`);
      }
    },
  });

  /** Mobile bottom bar: notifications up front; full app lives in hamburger. */
  const mobileQuickLinks = isDesk
    ? [
        { href: "/desk", label: t(lang, "board") },
        { href: "/desk/activity", label: t(lang, "live") },
        { href: "/desk/contacts", label: t(lang, "contact") },
        { href: "/desk/money", label: t(lang, "money") },
      ]
    : [
        { href: "/home", label: t(lang, "home") },
        { href: "/notifications", label: t(lang, "notifications") },
        { href: "/inbox", label: t(lang, "message") },
        { href: "/quotations", label: t(lang, "quotations") },
      ];

  const gridCols =
    sidebarOpen && !fullBleed
      ? "lg:grid-cols-[240px_1fr]"
      : sidebarOpen
        ? "lg:grid-cols-[240px_1fr]"
        : "lg:grid-cols-[0px_1fr]";

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(isDesk ? "/desk" : fullBleed ? "/inbox" : "/home");
    }
  }

  async function handleSignOut() {
    await dispatch(signOut());
    toast.info(t(lang, "signedOut"));
    router.push("/");
  }

  function NavItems({
    onNavigate,
    compact,
  }: {
    onNavigate?: () => void;
    compact?: boolean;
  }) {
    return (
      <>
        {navLinks.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
              className={`cmts-sidebar-link relative truncate rounded-xl px-3 py-2.5 font-semibold transition-colors ${
                compact ? "text-sm" : ""
              } ${
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
      </>
    );
  }

  return (
    <div
      className={`grid bg-paper ${
        fullBleed
          ? `h-[100dvh] max-h-[100dvh] overflow-hidden ${gridCols}`
          : `min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden ${gridCols}`
      }`}
    >
      {/* Desktop sidebar */}
      <aside
        className={`hidden min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-auto bg-[var(--sidebar)] text-paper transition-all lg:flex ${
          sidebarOpen
            ? "w-full p-5 opacity-100"
            : "pointer-events-none w-0 overflow-hidden p-0 opacity-0"
        }`}
      >
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass">
            {isDesk
              ? t(lang, "desk")
              : t(
                  lang,
                  account?.package === "SILVER"
                    ? "packageSilver"
                    : account?.package === "GOLD"
                      ? "packageGold"
                      : account?.package === "PLATINUM"
                        ? "packagePlatinum"
                        : "packageFree",
                )}
          </p>
          <h1 className="font-display mt-2 text-2xl font-bold">{t(lang, "brandName")}</h1>
          <p className="mt-2 text-sm text-[var(--sidebar-text)]">
            {account?.name}
            {account?.isOnline ? ` · ${t(lang, "online")}` : ""}
          </p>
        </div>

        <nav className="mt-8 grid flex-1 content-start gap-2">
          <NavItems />
        </nav>

        <button
          type="button"
          disabled={authBusy}
          className="mt-auto rounded-xl border border-white/20 px-3 py-2.5 text-left text-sm font-semibold text-[var(--sidebar-text)] disabled:opacity-50"
          onClick={() => void handleSignOut()}
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

      {/* Mobile left hamburger drawer — full feature set */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink/45"
            aria-label={t(lang, "hideMenu")}
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="animate-drawer-left absolute inset-y-0 left-0 flex w-[min(86vw,300px)] flex-col bg-[var(--sidebar)] p-5 text-paper shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass">
                  {isDesk ? t(lang, "desk") : t(lang, "brandName")}
                </p>
                <p className="mt-1 text-sm text-[var(--sidebar-text)]">{account?.name}</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-white/20 px-2.5 py-1 text-xs font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            <nav className="mt-6 grid flex-1 content-start gap-1.5 overflow-y-auto">
              <NavItems onNavigate={() => setMobileMenuOpen(false)} compact />
            </nav>
            <button
              type="button"
              disabled={authBusy}
              className="mt-4 rounded-xl border border-white/20 px-3 py-2.5 text-left text-sm font-semibold text-[var(--sidebar-text)] disabled:opacity-50"
              onClick={() => void handleSignOut()}
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
        </div>
      ) : null}

      <div
        className={
          fullBleed
            ? "flex h-full min-h-0 min-w-0 flex-col overflow-hidden pb-[3.5rem] lg:pb-0"
            : "mx-auto min-h-0 min-w-0 w-full max-w-[1100px] overflow-y-auto px-4 pb-24 pt-4 lg:px-8 lg:pb-8 lg:pt-5"
        }
      >
        {fullBleed ? (
          <div className="flex shrink-0 items-center gap-2 border-b border-line bg-cream px-3 py-2 lg:px-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold lg:hidden"
              aria-label={t(lang, "showMenu")}
            >
              ☰
            </button>
            <button
              type="button"
              onClick={() => dispatch(toggleSidebar())}
              className="hidden rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold lg:inline-flex"
              aria-label={sidebarOpen ? t(lang, "hideMenu") : t(lang, "showMenu")}
            >
              {sidebarOpen ? t(lang, "hideMenu") : t(lang, "showMenu")}
            </button>
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-semibold"
            >
              ← {t(lang, "back")}
            </button>
            {title ? <span className="truncate text-sm font-semibold">{title}</span> : null}
            {!isDesk && unread > 0 ? (
              <Link
                href="/notifications"
                className="ml-auto rounded-full bg-brass px-2 py-0.5 text-[0.65rem] font-bold text-forest lg:hidden"
              >
                {unread > 99 ? "99+" : unread}
              </Link>
            ) : null}
          </div>
        ) : null}
        {!fullBleed ? (
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex rounded-xl border border-line bg-cream px-3 py-2 text-xs font-semibold lg:hidden"
                aria-label={t(lang, "showMenu")}
              >
                ☰ {t(lang, "showMenu")}
              </button>
              <button
                type="button"
                onClick={goBack}
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
              {!isDesk ? (
                <Link
                  href="/notifications"
                  className="relative rounded-xl border border-line bg-cream px-3 py-2 text-xs font-semibold lg:hidden"
                >
                  {t(lang, "notifications")}
                  {unread > 0 ? (
                    <span className="ml-1 rounded-full bg-brass px-1.5 text-[0.65rem] font-bold text-forest">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                </Link>
              ) : null}
              <time className="hidden rounded-xl border border-line bg-cream px-3 py-2 text-xs font-semibold text-muted sm:inline-block">
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
                onChange={(e) => {
                  const next = e.target.value as UiLanguage;
                  dispatch(setUiLanguage(next));
                  try {
                    document.documentElement.lang = next;
                    document.documentElement.dir =
                      next === "ur" || next === "pa" || next === "ar" || next === "fa"
                        ? "rtl"
                        : "ltr";
                  } catch {
                    // ignore
                  }
                }}
              >
                {languageOptions.map((o) => (
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
        <div
          key={pathname}
          className={
            fullBleed
              ? // No page-in transform here — it breaks nested chat scroll on mobile.
                "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
              : "animate-page"
          }
        >
          {children}
        </div>
      </div>

      {/* Mobile bottom bar — notifications second (front after home); More opens full menu */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-cream/95 py-2 backdrop-blur lg:hidden ${
          isDesk ? "grid-cols-5" : "grid-cols-5"
        }`}
      >
        {mobileQuickLinks.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`cmts-press relative px-1 text-center text-[0.65rem] font-semibold ${
                active ? "text-forest" : "text-muted"
              }`}
            >
              {l.label}
              {l.href === "/notifications" && unread > 0 ? (
                <span className="animate-pulse-dot absolute right-1 top-0 h-2 w-2 rounded-full bg-brass" />
              ) : null}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="cmts-press px-1 text-center text-[0.65rem] font-semibold text-muted"
          aria-label={t(lang, "showMenu")}
        >
          ☰ {t(lang, "showMenu")}
        </button>
      </nav>
    </div>
  );
}
