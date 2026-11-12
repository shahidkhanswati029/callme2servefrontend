"use client";

import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";

export default function TermsPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="Terms"
        title="Terms of service"
        lede="Pilot terms for CallMeToServe. Company decisions that are still open (Stripe eligibility, exact referral percent) stay configurable."
      />
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-12 text-sm leading-relaxed text-muted sm:px-6">
        <p>
          By creating an expert seat you agree to keep a truthful place pin, honour accepted jobs,
          and never store full debit card numbers outside tokenised last4 flows.
        </p>
        <p>
          The company keeps package fees and job commission at the published package rate.
          Referrer shares come from the company side of commission and do not shrink the worker
          receipt.
        </p>
        <p>
          Desk may hold a shop for safety. Desk does not approve ordinary job payments. Quiet hours
          and safety holds never call emergency services.
        </p>
        <p>Contact the desk for disputes on completed jobs with a receipt number.</p>
      </section>
    </MarketingShell>
  );
}
