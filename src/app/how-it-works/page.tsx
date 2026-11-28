"use client";

import Link from "next/link";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";
import { t } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

const STEP_KEYS = [
  { title: "howStep1Title", body: "howStep1Body" },
  { title: "howStep2Title", body: "howStep2Body" },
  { title: "howStep3Title", body: "howStep3Body" },
  { title: "howStep4Title", body: "howStep4Body" },
  { title: "howStep5Title", body: "howStep5Body" },
] as const;

export default function HowItWorksPage() {
  const lang = useUiLanguage();

  return (
    <MarketingShell>
      <PageHero
        eyebrow={t(lang, "howItWorks")}
        title={t(lang, "howItWorksTitle")}
        lede={t(lang, "howItWorksLede")}
      />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <ol className="grid gap-4">
          {STEP_KEYS.map((s, i) => (
            <li
              key={s.title}
              className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-line bg-cream p-4"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-mint text-sm font-bold text-forest">
                {i + 1}
              </span>
              <div>
                <h2 className="font-semibold">{t(lang, s.title)}</h2>
                <p className="mt-1 text-sm text-muted">{t(lang, s.body)}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link
          href="/login"
          className="mt-8 inline-flex rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-paper"
        >
          {t(lang, "startAsExpert")}
        </Link>
      </section>
    </MarketingShell>
  );
}
