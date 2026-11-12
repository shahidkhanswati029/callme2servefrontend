"use client";

import Link from "next/link";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";

export default function AboutPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="About"
        title="Everyone is an expert."
        lede="CallMe2Serve is a global expert marketplace: Next.js, Express, PostgreSQL, Redux, Socket.io, and JWT — no Redis, no identity-card check."
      />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 text-sm leading-relaxed text-muted">
          <p>
            One expert account can ask for work or open a shop. Desk is a separate company seat
            that watches the board — it does not approve each payment. Job pay creates a real
            receipt and auto-releases the expert net.
          </p>
          <p>
            Place is a live GPS pin. A shop goes on the map only with a pin and a door photo.
            Language is separate from currency. Debit card is a rail; cash is not offered.
          </p>
          <p>
            We grow city by city worldwide. Packages stay Free 12%, Silver 9%, Gold 6%, Platinum
            2%. Referrers earn a share of commission without shrinking the worker&apos;s receipt.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/how-it-works"
            className="rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-paper"
          >
            How it works
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-line bg-cream px-5 py-3 text-sm font-semibold"
          >
            Join as expert
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
