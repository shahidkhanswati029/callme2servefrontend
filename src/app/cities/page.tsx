"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";
import { CityCover } from "@/modules/marketing/CityCover";
import { marketingApi } from "@/modules/marketing/api";
import { Loader } from "@/shared/ui/Loader";
import { canonicalizeCity, mergeCitiesByCanonical, t, tDynamic } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";
import { useAppSelector } from "@/store/hooks";

export default function CitiesPage() {
  const lang = useUiLanguage();
  const countryCode = useAppSelector((s) => s.uiPrefs.countryCode);
  const [cities, setCities] = useState<Array<{ city: string; experts: number; shops: number }>>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void marketingApi
      .cities(countryCode)
      .then((res) => setCities(mergeCitiesByCanonical(res.data.cities)))
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, [countryCode]);

  return (
    <MarketingShell>
      <PageHero
        eyebrow={t(lang, "cities")}
        title={t(lang, "citiesWeServe")}
        lede={t(lang, "livePinsCountry")}
      />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {loading ? (
          <Loader label={t(lang, "loading")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((c, i) => {
              const cityCanon = canonicalizeCity(c.city) || c.city;
              return (
              <div
                key={cityCanon}
                className="cmts-card overflow-hidden rounded-2xl border border-line bg-cream shadow-sm"
              >
                <CityCover
                  city={cityCanon}
                  countryCode={countryCode}
                  title={tDynamic(lang, cityCanon)}
                  index={i}
                  className="h-32"
                />
                <div className="grid grid-cols-2 gap-2 px-4 py-3 text-center text-sm">
                  <div>
                    <p className="font-display text-xl font-bold text-forest">{c.experts}</p>
                    <p className="text-xs text-muted">{t(lang, "expertsLabel")}</p>
                  </div>
                  <div>
                    <p className="font-display text-xl font-bold text-forest">{c.shops}</p>
                    <p className="text-xs text-muted">{t(lang, "shops")}</p>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <Link
                    href={`/search?city=${encodeURIComponent(cityCanon)}&country=${countryCode}`}
                    className="block rounded-xl bg-forest py-2.5 text-center text-sm font-semibold text-paper"
                  >
                    {t(lang, "explore")} {tDynamic(lang, cityCanon)}
                  </Link>
                </div>
              </div>
            );
            })}
          </div>
        )}
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/contact" className="font-semibold text-forest underline">
            {t(lang, "requestCity")}
          </Link>
        </p>
      </section>
    </MarketingShell>
  );
}
