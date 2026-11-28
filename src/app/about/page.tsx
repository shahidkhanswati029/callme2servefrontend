"use client";

import Link from "next/link";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";
import { t } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

export default function AboutPage() {
  const lang = useUiLanguage();

  return (
    <MarketingShell>
      <PageHero
        eyebrow={t(lang, "aboutEyebrow")}
        title={t(lang, "aboutTitle")}
        lede={t(lang, "aboutLede")}
      />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 text-sm leading-relaxed text-muted">
          <p>{t(lang, "aboutP1")}</p>
          <p>{t(lang, "aboutP2")}</p>
          <p>{t(lang, "aboutP3")}</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/how-it-works"
            className="rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-paper"
          >
            {t(lang, "howItWorks")}
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-line bg-cream px-5 py-3 text-sm font-semibold"
          >
            {t(lang, "joinAsExpert")}
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
