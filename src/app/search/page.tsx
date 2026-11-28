"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";
import { marketingApi, type PublicExpert } from "@/modules/marketing/api";
import { Loader } from "@/shared/ui/Loader";
import { Pagination } from "@/shared/ui/Pagination";
import { useAppSelector } from "@/store/hooks";
import { countryLabel, t, tDynamic, tExpertCard } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

export default function SearchPage() {
  return (
    <Suspense fallback={<Loader full label="…" />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const lang = useUiLanguage();
  const currency = useAppSelector((s) => s.uiPrefs.currency);
  const countryCode = useAppSelector((s) => s.uiPrefs.countryCode);
  const [q, setQ] = useState(params.get("q") || "");
  const [city, setCity] = useState(params.get("city") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [experts, setExperts] = useState<PublicExpert[]>([]);
  const [liveShops, setLiveShops] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pageSize = 12;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await marketingApi.search({
        q: q || undefined,
        city: city || undefined,
        category: category || undefined,
        country: countryCode,
        page,
        pageSize,
      });
      setExperts(res.data.experts);
      setTotal(res.data.total);
      setLiveShops(res.data.liveShops);
    } catch (err) {
      setExperts([]);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [q, city, category, countryCode, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setQ(params.get("q") || "");
    setCity(params.get("city") || "");
    setCategory(params.get("category") || "");
    setPage(1);
  }, [params]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (city.trim()) sp.set("city", city.trim());
    if (category.trim()) sp.set("category", category.trim());
    setPage(1);
    router.push(`/search?${sp.toString()}`);
  }

  return (
    <MarketingShell>
      <PageHero
        eyebrow={t(lang, "liveDirectory")}
        title={t(lang, "searchExpertsCta")}
        lede={t(lang, "findTrusted")}
      />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <form
          onSubmit={submit}
          className="grid gap-3 rounded-2xl border border-line bg-cream p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <input
            className="rounded-xl border border-line bg-paper px-3 py-3 text-sm"
            placeholder={t(lang, "searchExperts")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            className="rounded-xl border border-line bg-paper px-3 py-3 text-sm"
            placeholder={t(lang, "city")}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className="rounded-xl border border-line bg-paper px-3 py-3 text-sm"
            placeholder={t(lang, "category")}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-paper"
          >
            {t(lang, "search")}
          </button>
        </form>

        <p className="mt-4 text-sm text-muted">
          {total} {total === 1 ? t(lang, "expertSingular") : t(lang, "expertsLabel")} ·{" "}
          {countryLabel(lang, countryCode)}
          {liveShops ? ` · ${liveShops} ${t(lang, "shops")}` : ""} · {currency}
        </p>

        {loading ? (
          <Loader label={t(lang, "findingExperts")} />
        ) : error ? (
          <p className="mt-4 rounded-2xl border border-line bg-cream p-4 text-sm text-brass-deep">
            {error}
          </p>
        ) : experts.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-line bg-cream p-4 text-sm text-muted">
            {t(lang, "noExpertsMatch")}{" "}
            <Link href="/login" className="font-semibold text-forest underline">
              {t(lang, "signIn")}
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {experts.map((e) => (
              <article
                key={e.id}
                className={`cmts-card rounded-2xl border bg-cream p-4 ${
                  e.topRanked
                    ? "border-brass shadow-[0_8px_20px_rgba(224,154,43,0.2)]"
                    : "border-line"
                }`}
              >
                <div className="flex items-start gap-3">
                  {e.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.photoUrl}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-mint font-bold text-forest">
                      {e.name.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="truncate">{e.name}</strong>
                      {e.topRanked ? (
                        <span className="rounded-md bg-brass px-1.5 py-0.5 text-[0.55rem] font-bold uppercase text-forest">
                          {t(lang, "topRanked")}
                        </span>
                      ) : null}
                      <span
                        className={`h-2 w-2 rounded-full ${e.isOnline ? "bg-success" : "bg-line"}`}
                      />
                    </div>
                    <p className="text-sm text-muted">{tExpertCard(lang, e)}</p>
                    <p className="mt-1 text-xs font-semibold text-brass-deep">
                      ★ {Number(e.rating || 0).toFixed(1)} ({e.ratingCount}) ·{" "}
                      {tDynamic(lang, e.package)}
                    </p>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="mt-4 inline-flex rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-paper"
                >
                  {t(lang, "signIn")}
                </Link>
              </article>
            ))}
          </div>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
      </section>
    </MarketingShell>
  );
}
