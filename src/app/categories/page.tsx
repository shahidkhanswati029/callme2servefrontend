"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";
import { marketingApi } from "@/modules/marketing/api";
import { Loader } from "@/shared/ui/Loader";

const SEED = ["Tutor", "Surgical", "Leather", "Tailor", "Institute", "Factory", "Other"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Array<{ name: string; experts: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void marketingApi
      .categories()
      .then((res) => {
        const live = res.data.categories;
        if (live.length) setCategories(live);
        else setCategories(SEED.map((name) => ({ name, experts: 0 })));
      })
      .catch(() => setCategories(SEED.map((name) => ({ name, experts: 0 }))))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Categories"
        title="Popular service categories"
        lede="Browse by the work experts list on their profile. Counts update from the live database."
      />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {loading ? (
          <Loader label="Loading categories…" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/search?category=${encodeURIComponent(c.name)}`}
                className="rounded-2xl border border-line bg-cream px-5 py-6 transition hover:border-forest"
              >
                <h2 className="font-display text-xl font-bold">{c.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {c.experts} expert{c.experts === 1 ? "" : "s"} with a place pin
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </MarketingShell>
  );
}
