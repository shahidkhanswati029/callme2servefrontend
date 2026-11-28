"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GuestOnly } from "@/modules/identity/components/AuthGuard";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { CityCover } from "@/modules/marketing/CityCover";
import { marketingApi, type PublicExpert } from "@/modules/marketing/api";
import { useAppSelector } from "@/store/hooks";
import {
  canonicalizeCity,
  countryLabel,
  mergeCitiesByCanonical,
  t,
  tDynamic,
  tExpertCard,
} from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";
import { Reveal } from "@/shared/ui/Reveal";
import { useCompleteWordQuery } from "@/shared/useCompleteWordQuery";

const QUICK = ["Tutor", "Surgical", "Leather", "Tailor", "Institute"];

const FEATURES = [
  { titleKey: "featureFairRates", blurbKey: "featureFairRatesBlurb", tone: "bg-forest text-paper" },
  { titleKey: "featureFastAsk", blurbKey: "featureFastAskBlurb", tone: "bg-brass text-forest" },
  { titleKey: "featureLivePlace", blurbKey: "featureLivePlaceBlurb", tone: "bg-[#c45c6a] text-paper" },
  { titleKey: "featureAlwaysOn", blurbKey: "featureAlwaysOnBlurb", tone: "bg-success text-paper" },
  { titleKey: "featureShopsLive", blurbKey: "featureShopsLiveBlurb", tone: "bg-[#d97706] text-paper" },
  { titleKey: "featureReferEarn", blurbKey: "featureReferEarnBlurb", tone: "bg-[#5b4db8] text-paper" },
] as const;

const FALLBACK_CATS = [
  "Tutor",
  "Surgical",
  "Leather",
  "Tailor",
  "Institute",
  "Factory",
  "Other",
];

const LANDING_FILTER_CATS = ["All", ...FALLBACK_CATS] as const;

export default function WelcomePage() {
  const router = useRouter();
  const language = useUiLanguage();
  const countryCode = useAppSelector((s) => s.uiPrefs.countryCode);
  const currency = useAppSelector((s) => s.uiPrefs.currency);
  const [serviceQ, setServiceQ] = useState("");
  const [cityQ, setCityQ] = useState("");
  const [overview, setOverview] = useState({
    experts: 0,
    online: 0,
    liveShops: 0,
    ratingAvg: 0,
    ratingCount: 0,
    cities: 0,
  });
  const [cities, setCities] = useState<Array<{ city: string; experts: number; shops: number }>>(
    [],
  );
  const [categories, setCategories] = useState<Array<{ name: string; experts: number }>>([]);
  const [reviews, setReviews] = useState<
    Array<{
      id: string;
      stars: number;
      text: string | null;
      from: { name: string; photoUrl: string | null; work: string | null; city: string | null };
      about: { name: string; work: string | null };
    }>
  >([]);
  const [featured, setFeatured] = useState<PublicExpert[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [expertFilterCat, setExpertFilterCat] = useState("All");
  const [expertDraft, setExpertDraft] = useState("");
  const expertQ = useCompleteWordQuery(expertDraft);
  const [topRankedOnly, setTopRankedOnly] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [userGps, setUserGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsHint, setGpsHint] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) sessionStorage.setItem("cmts_ref", ref.toUpperCase());
    } catch {
      // ignore
    }
  }, []);

  const loadMarketing = useCallback(async () => {
    const [o, c, cats, r] = await Promise.all([
      marketingApi.overview(countryCode),
      marketingApi.cities(countryCode),
      marketingApi.categories(countryCode),
      marketingApi.reviews(6, countryCode),
    ]);
    setOverview(o.data.overview);
    setCities(mergeCitiesByCanonical(c.data.cities).slice(0, 8));
    setCategories(cats.data.categories.slice(0, 8));
    setReviews(r.data.reviews);
  }, [countryCode]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadMarketing();
      } catch {
        if (!cancelled) {
          // keep zeros — no dummy figures
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMarketing]);

  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsHint(t(language, "geoUnsupported"));
      setNearMe(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMe(true);
        setGpsHint("");
      },
      (err) => {
        setNearMe(false);
        setGpsHint(
          err.code === err.PERMISSION_DENIED
            ? t(language, "geoPermissionDenied")
            : t(language, "geoUnavailable"),
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 },
    );
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setFeaturedLoading(true);
      try {
        const s = await marketingApi.search({
          pageSize: 8,
          country: countryCode,
          category: expertFilterCat === "All" ? undefined : expertFilterCat,
          q: expertQ || undefined,
          topRankedOnly: topRankedOnly || undefined,
          onlineOnly: onlineOnly || undefined,
          sort: nearMe && userGps ? "distance" : "rating",
          latitude: nearMe && userGps ? userGps.lat : undefined,
          longitude: nearMe && userGps ? userGps.lng : undefined,
          km: nearMe && userGps ? 25 : undefined,
        });
        if (!cancelled) setFeatured(s.data.experts);
      } catch {
        if (!cancelled) setFeatured([]);
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    countryCode,
    expertFilterCat,
    expertQ,
    topRankedOnly,
    onlineOnly,
    nearMe,
    userGps,
  ]);

  const goSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const params = new URLSearchParams();
      if (serviceQ.trim()) params.set("q", serviceQ.trim());
      if (cityQ.trim()) params.set("city", cityQ.trim());
      params.set("country", countryCode);
      router.push(`/search?${params.toString()}`);
    },
    [serviceQ, cityQ, countryCode, router],
  );

  const catCards = useMemo(() => {
    const base =
      categories.length > 0
        ? categories
        : FALLBACK_CATS.map((name) => ({ name, experts: 0 }));
    if (categoryFilter === "All") return base;
    return base.filter((c) => c.name.toLowerCase() === categoryFilter.toLowerCase());
  }, [categories, categoryFilter]);

  return (
    <GuestOnly>
      <MarketingShell>
        <section className="relative overflow-hidden bg-forest text-paper">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-45 animate-fade"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 12% 15%, rgba(224,154,43,0.32), transparent 55%), radial-gradient(ellipse 45% 40% at 88% 8%, rgba(229,242,235,0.12), transparent 50%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 top-24 h-40 w-40 rounded-full bg-brass/20 blur-2xl animate-drift"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 bottom-20 h-48 w-48 rounded-full bg-paper/10 blur-3xl animate-float"
          />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
            <div>
              <p className="animate-rise text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brass">
                {t(language, "landingEyebrow")} · {countryLabel(language, countryCode)} ·{" "}
                {currency}
              </p>
              <h1 className="animate-rise font-display mt-3 text-[clamp(2.3rem,5vw,3.7rem)] font-bold leading-[1.06] [animation-delay:70ms]">
                {t(language, "findTrusted")}
              </h1>
              <p className="animate-rise mt-4 max-w-xl text-sm leading-relaxed text-[#d5e0d8] sm:text-base [animation-delay:120ms]">
                {t(language, "heroLede")}
              </p>
              <div className="animate-rise mt-6 flex flex-wrap gap-4 text-xs font-semibold text-[#d5e0d8] [animation-delay:170ms]">
                {[
                  t(language, "instantAsk"),
                  t(language, "verifiedPlace"),
                  t(language, "realReceipts"),
                ].map((label, i) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 animate-bob"
                    style={{ animationDelay: `${i * 0.35}s` }}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brass text-forest animate-glow">
                      ✓
                    </span>
                    {label}
                  </span>
                ))}
              </div>
              <Link
                href="/login"
                className="cmts-press animate-rise mt-8 inline-flex cursor-pointer rounded-xl bg-brass px-5 py-3 text-sm font-bold uppercase tracking-wide text-forest shadow-[0_12px_32px_rgba(224,154,43,0.35)] hover:cursor-pointer [animation-delay:220ms]"
              >
                {t(language, "expertCta")}
              </Link>
            </div>

            <form
              onSubmit={goSearch}
              className="animate-scale rounded-3xl border border-white/10 bg-cream p-5 text-ink shadow-[0_28px_70px_rgba(0,0,0,0.28)] [animation-delay:120ms]"
            >
              <h2 className="font-display text-xl font-bold">{t(language, "whatService")}</h2>
              <label className="mt-4 grid gap-1 text-sm font-semibold">
                {t(language, "service")}
                <input
                  className="rounded-xl border border-line bg-paper px-3 py-3 font-normal outline-none focus:border-forest"
                  placeholder={`${tDynamic(language, "Tutor")}, ${tDynamic(language, "Surgical")}, ${tDynamic(language, "Leather")}…`}
                  value={serviceQ}
                  onChange={(e) => setServiceQ(e.target.value)}
                />
              </label>
              <label className="mt-3 grid gap-1 text-sm font-semibold">
                {t(language, "city")}
                <input
                  className="rounded-xl border border-line bg-paper px-3 py-3 font-normal outline-none focus:border-forest"
                  placeholder={t(language, "searchCity")}
                  value={cityQ}
                  onChange={(e) => setCityQ(e.target.value)}
                />
              </label>
              <button
                type="submit"
                className="cmts-press mt-4 w-full rounded-xl bg-forest py-3 text-sm font-semibold text-paper"
              >
                {t(language, "searchExpertsCta")}
              </button>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setServiceQ(q)}
                    className="cmts-pill rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-muted hover:border-forest hover:text-forest"
                  >
                    {tDynamic(language, q)}
                  </button>
                ))}
              </div>
            </form>
          </div>
          <svg
            className="relative block w-full text-paper"
            viewBox="0 0 1440 48"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path fill="currentColor" d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" />
          </svg>
        </section>

        <section className="mx-auto -mt-1 grid max-w-6xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            [`${overview.experts}+`, t(language, "verifiedExperts")],
            [`${overview.cities}+`, t(language, "citiesCovered")],
            [`${overview.online}`, t(language, "onlineNow")],
            [
              overview.ratingCount ? `${overview.ratingAvg.toFixed(1)}★` : "—",
              `${overview.ratingCount} ${t(language, "reviewsCount")}`,
            ],
          ].map(([value, label], i) => (
            <Reveal key={label} delay={i * 80}>
              <div className="cmts-card rounded-2xl border border-forest/15 bg-cream px-4 py-4 text-center shadow-sm">
                <p className="font-display text-2xl font-bold text-forest">{value}</p>
                <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
                  {label}
                </p>
              </div>
            </Reveal>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const title = t(language, f.titleKey);
              return (
                <Reveal key={f.titleKey} delay={i * 70}>
                  <div className="cmts-card flex items-start gap-3 rounded-2xl border border-line bg-cream p-4">
                    <span
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-bold ${f.tone}`}
                    >
                      {title.charAt(0)}
                    </span>
                    <div>
                      <strong className="text-sm">{title}</strong>
                      <p className="mt-0.5 text-sm text-muted">{t(language, f.blurbKey)}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <p className="inline-block rounded-md bg-brass px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-forest">
            {t(language, "categories")}
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-bold">{t(language, "popularCategories")}</h2>
            <Link href="/categories" className="text-sm font-semibold text-forest underline">
              {t(language, "exploreAll")}
            </Link>
          </div>
          <p className="mt-2 text-xs text-muted">{t(language, "filterCategories")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LANDING_FILTER_CATS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategoryFilter(name)}
                className={`cmts-pill rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  categoryFilter === name
                    ? "bg-forest text-paper"
                    : "border border-line bg-cream text-ink"
                }`}
              >
                {name === "All" ? t(language, "filterAllStatuses") : tDynamic(language, name)}
              </button>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {catCards.map((c, i) => (
              <Reveal key={c.name} delay={i * 60} variant="scale">
                <Link
                  href={`/search?category=${encodeURIComponent(c.name)}`}
                  className="cmts-card block cursor-pointer rounded-2xl border border-line bg-cream px-4 py-5 hover:cursor-pointer"
                >
                  <p className="font-semibold">{tDynamic(language, c.name)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {c.experts}{" "}
                    {c.experts === 1 ? t(language, "expertSingular") : t(language, "expertsLabel")} ·{" "}
                    {currency}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-mint/35 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-bold">
              {t(language, "expertsInCountry")} {countryLabel(language, countryCode)}
            </h2>
            <p className="mt-1 text-sm text-muted">{t(language, "livePinsCountry")}</p>
            <p className="mt-1 text-xs text-muted">{t(language, "searchWhenWordDone")}</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className="rounded-xl border border-line bg-cream px-3 py-2.5 text-sm text-ink"
                placeholder={t(language, "searchExperts")}
                value={expertDraft}
                onChange={(e) => setExpertDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setExpertDraft((v) => `${v.trim()} `);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (nearMe) {
                    setNearMe(false);
                  } else {
                    requestGps();
                  }
                }}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  nearMe ? "bg-forest text-paper" : "border border-line bg-cream text-ink"
                }`}
              >
                {t(language, "filterNearMe")}
              </button>
            </div>
            {gpsHint ? <p className="mt-2 text-xs text-brass-deep">{gpsHint}</p> : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {LANDING_FILTER_CATS.map((name) => (
                <button
                  key={`ex-${name}`}
                  type="button"
                  onClick={() => setExpertFilterCat(name)}
                  className={`cmts-pill rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    expertFilterCat === name
                      ? "bg-forest text-paper"
                      : "border border-line bg-cream text-ink"
                  }`}
                >
                  {name === "All" ? t(language, "filterAllStatuses") : tDynamic(language, name)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTopRankedOnly((v) => !v)}
                className={`cmts-pill rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  topRankedOnly ? "bg-brass text-forest" : "border border-line bg-cream text-ink"
                }`}
              >
                {t(language, "filterTopRanked")}
              </button>
              <button
                type="button"
                onClick={() => setOnlineOnly((v) => !v)}
                className={`cmts-pill rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  onlineOnly ? "bg-success text-paper" : "border border-line bg-cream text-ink"
                }`}
              >
                {t(language, "filterOnlineOnly")}
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featuredLoading ? (
                <p className="text-sm text-muted sm:col-span-2 lg:col-span-4">
                  {t(language, "findingExperts")}
                </p>
              ) : featured.length === 0 ? (
                <p className="rounded-2xl border border-line bg-cream p-4 text-sm text-muted sm:col-span-2 lg:col-span-4">
                  {t(language, "noExpertsMatch")}
                </p>
              ) : (
                featured.map((e, i) => (
                  <Reveal key={e.id} delay={i * 70} variant="rise">
                    <Link
                      href={`/search?q=${encodeURIComponent(e.name)}&country=${countryCode}`}
                      className={`cmts-card block cursor-pointer rounded-2xl border bg-cream p-4 hover:cursor-pointer ${
                        e.topRanked
                          ? "border-brass shadow-[0_8px_24px_rgba(224,154,43,0.22)]"
                          : "border-line"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {e.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={e.photoUrl}
                            alt=""
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <span className="grid h-11 w-11 place-items-center rounded-full bg-mint font-bold text-forest">
                            {e.name.charAt(0)}
                          </span>
                        )}
                        <div>
                          <strong className="text-sm">{e.name}</strong>
                          <p className="text-xs text-muted">{tExpertCard(language, e)}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-brass-deep">
                        ★ {Number(e.rating || 0).toFixed(1)} ({e.ratingCount})
                        {e.isOnline ? ` · ${t(language, "online")}` : ` · ${t(language, "offline")}`}
                        {e.topRanked ? ` · ${t(language, "topRanked")}` : ""}
                        {e.distanceKm != null ? ` · ${e.distanceKm} km` : ""}
                        {` · ${tDynamic(language, e.package)}`}
                      </p>
                    </Link>
                  </Reveal>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-center text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brass-deep">
            {t(language, "testimonials")}
          </p>
          <h2 className="font-display mt-2 text-center text-3xl font-bold">
            {t(language, "whatCustomersSay")}
          </h2>
          {reviews.length === 0 ? (
            <p className="mx-auto mt-6 max-w-lg text-center text-sm text-muted">
              {t(language, "reviewsEmpty")}
            </p>
          ) : (
            <>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {reviews.slice(0, 4).map((r, i) => (
                  <Reveal key={r.id} delay={i * 80} variant={i % 2 === 0 ? "slide-left" : "slide-right"}>
                  <article
                    className="rounded-2xl border border-line bg-cream p-5 shadow-sm"
                  >
                    <p className="text-brass">
                      {"★".repeat(r.stars)}
                      {"☆".repeat(5 - r.stars)}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-ink">“{r.text}”</p>
                    <div className="mt-4 flex items-center gap-3">
                      {r.from.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.from.photoUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-mint font-bold text-forest">
                          {r.from.name.charAt(0)}
                        </span>
                      )}
                      <div>
                        <strong className="text-sm">{r.from.name}</strong>
                        <p className="text-xs text-muted">
                          {tDynamic(language, r.from.work) || t(language, "experts")}
                          {r.from.city ? ` · ${tDynamic(language, r.from.city)}` : ""} ·{" "}
                          {r.about.name}
                        </p>
                      </div>
                    </div>
                  </article>
                  </Reveal>
                ))}
              </div>
              <p className="mt-6 text-center text-sm font-semibold text-muted">
                {overview.ratingAvg.toFixed(1)} · {overview.ratingCount}{" "}
                {t(language, "reviewsCount")}
              </p>
            </>
          )}
        </section>

        <section className="border-t border-line bg-paper py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brass-deep">
              {t(language, "cities")}
            </p>
            <h2 className="font-display mt-2 text-center text-3xl font-bold">
              {t(language, "citiesWeServe")}
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {cities.map((c, i) => {
                const cityCanon = canonicalizeCity(c.city) || c.city;
                return (
                <Reveal key={cityCanon} delay={i * 90}>
                <div className="cmts-card overflow-hidden rounded-2xl border border-line bg-cream shadow-sm">
                  <CityCover
                    city={cityCanon}
                    countryCode={countryCode}
                    title={tDynamic(language, cityCanon)}
                    index={i}
                    className="h-36"
                    titleClassName="font-display text-2xl font-bold"
                  />
                  <div className="grid grid-cols-2 gap-2 px-4 py-3 text-center text-sm">
                    <div>
                      <p className="font-display text-xl font-bold text-forest">{c.experts}</p>
                      <p className="text-xs text-muted">{t(language, "expertsLabel")}</p>
                    </div>
                    <div>
                      <p className="font-display text-xl font-bold text-forest">{c.shops}</p>
                      <p className="text-xs text-muted">{t(language, "shops")}</p>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <Link
                      href={`/search?city=${encodeURIComponent(cityCanon)}&country=${countryCode}`}
                      className="cmts-press block rounded-xl bg-forest py-2.5 text-center text-sm font-semibold text-paper"
                    >
                      {t(language, "explore")} {tDynamic(language, cityCanon)}
                    </Link>
                  </div>
                </div>
                </Reveal>
              );
              })}
            </div>
            <p className="mt-6 text-center text-sm text-muted">
              <Link href="/contact" className="font-semibold text-forest underline">
                {t(language, "requestCity")}
              </Link>
            </p>
          </div>
        </section>
      </MarketingShell>
    </GuestOnly>
  );
}
