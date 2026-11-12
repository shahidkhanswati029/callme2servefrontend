"use client";

import Link from "next/link";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";

const STEPS = [
  {
    title: "Open an expert seat",
    body: "Google or Facebook creates the account. Finish work, city, languages, then enrol fingerprint or face.",
  },
  {
    title: "Drop your place pin",
    body: "Settings → Place uses real GPS. Nearby experts and shops are ordered by distance.",
  },
  {
    title: "Ask or accept a job",
    body: "Quotation + visit fee + preferred rail. Worker accepts. Asker pays with wallet, PayPal/Google Pay, or debit.",
  },
  {
    title: "Receipt & rating",
    body: "Payment writes a real receipt (quote, visit, commission, net). Rate only after the job is completed.",
  },
  {
    title: "Open a shop",
    body: "Create the shop, capture the door pin, upload a door photo. Both are required before LIVE.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="How it works"
        title="From welcome to receipt"
        lede="The same flow drawn in the phone and laptop frames — built without Redis and without an identity-card check."
      />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <ol className="grid gap-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-line bg-cream p-4"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-mint text-sm font-bold text-forest">
                {i + 1}
              </span>
              <div>
                <h2 className="font-semibold">{s.title}</h2>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link
          href="/login"
          className="mt-8 inline-flex rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-paper"
        >
          Start as expert
        </Link>
      </section>
    </MarketingShell>
  );
}
