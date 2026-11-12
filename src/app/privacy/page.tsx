"use client";

import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="Privacy"
        title="Privacy policy"
        lede="We store account, place, chat, and ledger records in PostgreSQL. We do not store fingerprint images."
      />
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-12 text-sm leading-relaxed text-muted sm:px-6">
        <p>
          Sign-in uses Google, Facebook, or WebAuthn. Refresh tokens are hashed. Chat media goes to
          Cloudinary. Push tokens are optional for background alerts.
        </p>
        <p>
          Place accuracy and coordinates are used for nearby search. Phone numbers are not shown
          inside chat threads.
        </p>
        <p>
          Debit card full numbers and CVC are validated then discarded — only a token / last4 may
          remain.
        </p>
        <p>Email hello@callmetoserve.pk to ask for account deletion during the pilot.</p>
      </section>
    </MarketingShell>
  );
}
