"use client";

import Link from "next/link";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";

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
    a: "Free 12%, Silver 9%, Gold 6%, Platinum 2% of the job total. Monthly package fees are separate ledger lines.",
  },
  {
    q: "How does referrer QR work?",
    a: "Scan or open /?ref=CODE when joining. The referrer earns a share of commission; the working expert still receives the full net on the receipt.",
  },
  {
    q: "Is Redis required?",
    a: "No. The plan leaves Redis out. Live place is a PostGIS/point in PostgreSQL; chat uses Socket.io on the same Node process.",
  },
];

export default function FaqPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="FAQ"
        title="Answers from the build plan"
        lede="Short answers aligned with the CallMeToServe development plan — not marketing fluff."
      />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="grid gap-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-line bg-cream px-4 py-3 open:border-forest"
            >
              <summary className="cursor-pointer list-none font-semibold marker:content-none">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span className="text-brass group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted">
          Still stuck?{" "}
          <Link href="/contact" className="font-semibold text-forest underline">
            Contact the desk
          </Link>
          .
        </p>
      </section>
    </MarketingShell>
  );
}
