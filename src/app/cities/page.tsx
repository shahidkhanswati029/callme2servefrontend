"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";
import { marketingApi } from "@/modules/marketing/api";
import { Loader } from "@/shared/ui/Loader";
import { canonicalizeCity, mergeCitiesByCanonical, t, tDynamic } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";
import { useAppSelector } from "@/store/hooks";

const GRADIENTS = [
  "from-[#1b3c33] to-[#2d6b58]",
  "from-[#8c5a0c] to-[#e09a2b]",
  "from-[#1f7a62] to-[#14332b]",
  "from-[#5b4db8] to-[#1b3c33]",
];

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
                <div
                  className={`flex h-32 items-end bg-gradient-to-br px-4 py-3 text-paper ${
                    GRADIENTS[i % GRADIENTS.length]
                  }`}
                >
                  <h2 className="font-display text-2xl font-bold">{tDynamic(lang, cityCanon)}</h2>
                </div>
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
