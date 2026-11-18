"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";
import { marketingApi } from "@/modules/marketing/api";
import { Loader } from "@/shared/ui/Loader";
import { t, tDynamic } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";
import { useAppSelector } from "@/store/hooks";

const SEED = ["Tutor", "Surgical", "Leather", "Tailor", "Institute", "Factory", "Other"];

export default function CategoriesPage() {
  const lang = useUiLanguage();
  const countryCode = useAppSelector((s) => s.uiPrefs.countryCode);
  const [categories, setCategories] = useState<Array<{ name: string; experts: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void marketingApi
      .categories(countryCode)
      .then((res) => {
        const live = res.data.categories;
        if (live.length) setCategories(live);
        else setCategories(SEED.map((name) => ({ name, experts: 0 })));
      })
      .catch(() => setCategories(SEED.map((name) => ({ name, experts: 0 }))))
      .finally(() => setLoading(false));
  }, [countryCode]);

  return (
    <MarketingShell>
      <PageHero
        eyebrow={t(lang, "categories")}
        title={t(lang, "popularCategories")}
        lede={t(lang, "livePinsCountry")}
      />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {loading ? (
          <Loader label={t(lang, "loading")} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/search?category=${encodeURIComponent(c.name)}`}
                className="cmts-card rounded-2xl border border-line bg-cream px-5 py-6"
              >
                <h2 className="font-display text-xl font-bold">{tDynamic(lang, c.name)}</h2>
                <p className="mt-1 text-sm text-muted">
                  {c.experts}{" "}
                  {c.experts === 1 ? t(lang, "expertSingular") : t(lang, "expertsLabel")}{" "}
                  {t(lang, "withPlacePin")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </MarketingShell>
  );
}
