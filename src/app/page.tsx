"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GuestOnly } from "@/modules/identity/components/AuthGuard";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { marketingApi, type PublicExpert } from "@/modules/marketing/api";
import { useAppSelector } from "@/store/hooks";
import { t } from "@/shared/i18n";

const QUICK = ["Tutor", "Surgical", "Leather", "Tailor", "Institute"];

const FEATURES = [
  { title: "Fair rates", blurb: "Free 12% · Silver 9% · Gold 6% · Platinum 2%", tone: "bg-forest text-paper" },
  { title: "Fast ask", blurb: "Ask · accept · pay · receipt", tone: "bg-brass text-forest" },
  { title: "Live place", blurb: "Real GPS pin on the map", tone: "bg-[#c45c6a] text-paper" },
  { title: "Always on", blurb: "Inbox · jobs · alarms", tone: "bg-success text-paper" },
  { title: "Shops live", blurb: "Pin + door photo to publish", tone: "bg-[#d97706] text-paper" },
  { title: "Refer & earn", blurb: "QR share · company keeps commission", tone: "bg-[#5b4db8] text-paper" },
];

const FALLBACK_CATS = [
  "Tutor",
  "Surgical",
  "Leather",
  "Tailor",
  "Institute",
  "Factory",
  "Other",
];

const CITY_GRADIENTS = [
  "from-[#1b3c33] to-[#2d6b58]",
  "from-[#8c5a0c] to-[#e09a2b]",
  "from-[#1f7a62] to-[#1b3c33]",
  "from-[#14332b] to-[#4a5c54]",
  "from-[#5b4db8] to-[#1b3c33]",
  "from-[#c45c6a] to-[#8c5a0c]",
];

function cityArt(city: string, index: number) {
  const known: Record<string, string> = {
    Sialkot: CITY_GRADIENTS[0],
    Lahore: CITY_GRADIENTS[1],
    Islamabad: CITY_GRADIENTS[2],
    Karachi: CITY_GRADIENTS[3],
    Dubai: CITY_GRADIENTS[4],
    London: CITY_GRADIENTS[5],
  };
  return known[city] || CITY_GRADIENTS[index % CITY_GRADIENTS.length];
}

export default function WelcomePage() {
  const router = useRouter();
  const language = useAppSelector((s) => s.uiPrefs.language);
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

  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) sessionStorage.setItem("cmts_ref", ref.toUpperCase());
    } catch {
      // ignore
    }
  }, []);

  const loadMarketing = useCallback(async () => {
    const [o, c, cats, r, s] = await Promise.all([
      marketingApi.overview(countryCode),
      marketingApi.cities(countryCode),
      marketingApi.categories(countryCode),
      marketingApi.reviews(6, countryCode),
      marketingApi.search({ pageSize: 8, country: countryCode }),
    ]);
    setOverview(o.data.overview);
    setCities(c.data.cities.slice(0, 8));
    setCategories(cats.data.categories.slice(0, 8));
    setReviews(r.data.reviews);
    setFeatured(s.data.experts);
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

  const catCards = useMemo(
    () =>
      categories.length > 0
        ? categories
        : FALLBACK_CATS.map((name) => ({ name, experts: 0 })),
    [categories],
  );

  return (
    <GuestOnly>
      <MarketingShell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "CallMe2Serve",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://callme2serve.com",
              description:
                "Find trusted local experts with live GPS pins. Ask for work, open a shop, pay digitally.",
              potentialAction: {
                "@type": "SearchAction",
                target: `${process.env.NEXT_PUBLIC_SITE_URL || "https://callme2serve.com"}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <section className="relative overflow-hidden bg-forest text-paper">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-45"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 12% 15%, rgba(224,154,43,0.32), transparent 55%), radial-gradient(ellipse 45% 40% at 88% 8%, rgba(229,242,235,0.12), transparent 50%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brass">
                {t(language, "landingEyebrow")} · {countryCode} · {currency}
              </p>
              <h1 className="font-display mt-3 text-[clamp(2.3rem,5vw,3.7rem)] font-bold leading-[1.06]">
                {t(language, "findTrusted")}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#d5e0d8] sm:text-base">
                {t(language, "heroLede")}
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-[#d5e0d8]">
                {[
                  t(language, "instantAsk"),
                  t(language, "verifiedPlace"),
                  t(language, "realReceipts"),
                ].map((label) => (
                  <span key={label} className="inline-flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brass text-forest">
                      ✓
                    </span>
                    {label}
                  </span>
                ))}
              </div>
              <Link
                href="/login"
                className="mt-8 inline-flex rounded-xl bg-brass px-5 py-3 text-sm font-bold uppercase tracking-wide text-forest shadow-[0_12px_32px_rgba(224,154,43,0.35)]"
              >
                {t(language, "expertCta")}
              </Link>
            </div>

            <form
              onSubmit={goSearch}
              className="rounded-3xl border border-white/10 bg-cream p-5 text-ink shadow-[0_28px_70px_rgba(0,0,0,0.28)]"
            >
              <h2 className="font-display text-xl font-bold">{t(language, "whatService")}</h2>
              <label className="mt-4 grid gap-1 text-sm font-semibold">
                {t(language, "service")}
                <input
                  className="rounded-xl border border-line bg-paper px-3 py-3 font-normal outline-none focus:border-forest"
                  placeholder="Tutor, Surgical, Leather…"
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
                className="mt-4 w-full rounded-xl bg-forest py-3 text-sm font-semibold text-paper"
              >
                {t(language, "searchExpertsCta")}
              </button>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setServiceQ(q)}
                    className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-muted hover:border-forest hover:text-forest"
                  >
                    {q}
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
            [`${overview.experts}+`, "Verified experts"],
            [`${overview.cities}+`, "Cities covered"],
            [`${overview.online}`, "Online now"],
            [
              overview.ratingCount
                ? `${overview.ratingAvg.toFixed(1)}★`
                : "—",
              `${overview.ratingCount} reviews`,
            ],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-2xl border border-forest/15 bg-cream px-4 py-4 text-center shadow-sm"
            >
              <p className="font-display text-2xl font-bold text-forest">{value}</p>
              <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
                {label}
              </p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 rounded-2xl border border-line bg-cream p-4"
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-bold ${f.tone}`}
                >
                  {f.title.charAt(0)}
                </span>
                <div>
                  <strong className="text-sm">{f.title}</strong>
                  <p className="mt-0.5 text-sm text-muted">{f.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <p className="inline-block rounded-md bg-brass px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-forest">
            Categories
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-bold">{t(language, "popularCategories")}</h2>
            <Link href="/categories" className="text-sm font-semibold text-forest underline">
              {t(language, "exploreAll")}
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {catCards.map((c) => (
              <Link
                key={c.name}
                href={`/search?category=${encodeURIComponent(c.name)}`}
                className="rounded-2xl border border-line bg-cream px-4 py-5 transition hover:border-forest"
              >
                <p className="font-semibold">{c.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {c.experts} expert{c.experts === 1 ? "" : "s"} · {currency}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {featured.length > 0 ? (
          <section className="border-y border-line bg-mint/35 py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="font-display text-3xl font-bold">
                Experts in {countryCode}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Live pins for this country · top rankings highlighted.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((e) => (
                  <Link
                    key={e.id}
                    href={`/search?q=${encodeURIComponent(e.name)}&country=${countryCode}`}
                    className={`rounded-2xl border bg-cream p-4 ${
                      e.topRanked ? "border-brass shadow-[0_8px_24px_rgba(224,154,43,0.22)]" : "border-line"
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
                        <p className="text-xs text-muted">
                          {e.work || "Expert"} · {e.city || "—"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-brass-deep">
                      ★ {Number(e.rating || 0).toFixed(1)} ({e.ratingCount})
                      {e.isOnline ? " · Online" : ""}
                      {e.topRanked ? ` · ${t(language, "topRanked")}` : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-center text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brass-deep">
            {t(language, "testimonials")}
          </p>
          <h2 className="font-display mt-2 text-center text-3xl font-bold">
            {t(language, "whatCustomersSay")}
          </h2>
          {reviews.length === 0 ? (
            <p className="mx-auto mt-6 max-w-lg text-center text-sm text-muted">
              Reviews appear here after real completed jobs are rated — nothing invented.
            </p>
          ) : (
            <>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {reviews.slice(0, 4).map((r) => (
                  <article
                    key={r.id}
                    className="rounded-2xl border border-line bg-cream p-5 shadow-sm"
                  >
                    <p className="text-brass">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</p>
                    <p className="mt-3 text-sm leading-relaxed text-ink">
                      “{r.text}”
                    </p>
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
                          {r.from.work || "Expert"}
                          {r.from.city ? ` · ${r.from.city}` : ""} · rated {r.about.name}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <p className="mt-6 text-center text-sm font-semibold text-muted">
                {overview.ratingAvg.toFixed(1)} from {overview.ratingCount} review
                {overview.ratingCount === 1 ? "" : "s"}
              </p>
            </>
          )}
        </section>

        <section className="border-t border-line bg-paper py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brass-deep">
              Coverage
            </p>
            <h2 className="font-display mt-2 text-center text-3xl font-bold">
              {t(language, "citiesWeServe")}
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {cities.map((c, i) => (
                <div
                  key={c.city}
                  className="overflow-hidden rounded-2xl border border-line bg-cream shadow-sm"
                >
                  <div
                    className={`flex h-36 items-end bg-gradient-to-br px-4 py-3 text-paper ${cityArt(
                      c.city,
                      i,
                    )}`}
                  >
                    <h3 className="font-display text-2xl font-bold">{c.city}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 px-4 py-3 text-center text-sm">
                    <div>
                      <p className="font-display text-xl font-bold text-forest">{c.experts}</p>
                      <p className="text-xs text-muted">Experts</p>
                    </div>
                    <div>
                      <p className="font-display text-xl font-bold text-forest">{c.shops}</p>
                      <p className="text-xs text-muted">Live shops</p>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <Link
                      href={`/search?city=${encodeURIComponent(c.city)}&country=${countryCode}`}
                      className="block rounded-xl bg-forest py-2.5 text-center text-sm font-semibold text-paper"
                    >
                      {t(language, "explore")} {c.city}
                    </Link>
                  </div>
                </div>
              ))}
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
