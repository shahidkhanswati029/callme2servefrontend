"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";
import { marketingApi } from "@/modules/marketing/api";
import { Loader } from "@/shared/ui/Loader";

const GRADIENTS = [
  "from-[#1b3c33] to-[#2d6b58]",
  "from-[#8c5a0c] to-[#e09a2b]",
  "from-[#1f7a62] to-[#14332b]",
  "from-[#5b4db8] to-[#1b3c33]",
];

export default function CitiesPage() {
  const [cities, setCities] = useState<Array<{ city: string; experts: number; shops: number }>>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void marketingApi
      .cities()
      .then((res) => setCities(res.data.cities))
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Cities"
        title="Cities we serve"
        lede="Counts are live from expert pins and live shops. Empty cities show zero — we do not invent providers."
      />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {loading ? (
          <Loader label="Loading cities…" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((c, i) => (
              <div
                key={c.city}
                className="overflow-hidden rounded-2xl border border-line bg-cream shadow-sm"
              >
                <div
                  className={`flex h-32 items-end bg-gradient-to-br px-4 py-3 text-paper ${
                    GRADIENTS[i % GRADIENTS.length]
                  }`}
                >
                  <h2 className="font-display text-2xl font-bold">{c.city}</h2>
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
                    href={`/search?city=${encodeURIComponent(c.city)}`}
                    className="block rounded-xl bg-forest py-2.5 text-center text-sm font-semibold text-paper"
                  >
                    Explore {c.city}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-sm text-muted">
          Don&apos;t see your city?{" "}
          <Link href="/contact" className="font-semibold text-forest underline">
            Request your city
          </Link>
        </p>
      </section>
    </MarketingShell>
  );
}
