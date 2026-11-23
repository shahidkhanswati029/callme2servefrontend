"use client";

import Link from "next/link";
import { useState } from "react";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";
import { t } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

const FAQS = [
  {
    q: "Do I need a password?",
    a: "No. Experts use Google or Facebook, then fingerprint or face on the device. Desk signs in with email only.",
  },
  {
    q: "How does payment work?",
    a: "Asker sends quotation + visit fee. Worker accepts. Asker pays with JazzCash, Easypaisa, Google Pay, PayPal, or debit. Cash is disabled. Desk does not approve the transfer — the receipt and net release are automatic.",
  },
  {
    q: "When does a shop appear on the map?",
    a: "Only when the shop has a live GPS pin and a door photo. A typed street alone never publishes.",
  },
  {
    q: "What are the package rates?",
    a: "Job commission is 0% for free and paid experts for now. Package upgrade fees (Silver / Gold / Platinum) are separate. Commission rates can be turned on later without changing today’s receipts.",
  },
  {
    q: "How does referrer QR work?",
    a: "Scan or open /?ref=CODE when joining. Referrers share package upgrade fees (50/50). When job commission is enabled later, referrer share comes from the company side — the working expert still receives the full net.",
  },
  {
    q: "Is Redis required?",
    a: "No. The plan leaves Redis out. Live place is a PostGIS/point in PostgreSQL; chat uses Socket.io on the same Node process.",
  },
];

export default function FaqPage() {
  const lang = useUiLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <MarketingShell>
      <PageHero
        compact
        eyebrow={t(lang, "faq")}
        title="Answers from the build plan"
        lede="Short answers aligned with the CallMeToServe development plan - not marketing fluff."
      />
      <section className="relative z-[1] mx-auto max-w-3xl bg-paper px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-3">
          {FAQS.map((item, index) => {
            const open = openIndex === index;
            return (
              <div
                key={item.q}
                className={`rounded-2xl border bg-cream px-4 py-3 ${
                  open ? "border-forest" : "border-line"
                }`}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left font-semibold text-ink"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : index)}
                >
                  <span>{item.q}</span>
                  <span
                    className={`shrink-0 text-brass transition-transform duration-200 ${
                      open ? "rotate-45" : ""
                    }`}
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                {open ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-sm text-muted">
          Still stuck?{" "}
          <Link href="/contact" className="font-semibold text-forest underline">
            {t(lang, "contact")}
          </Link>
          .
        </p>
      </section>
    </MarketingShell>
  );
}
