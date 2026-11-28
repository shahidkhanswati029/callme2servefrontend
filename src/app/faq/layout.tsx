import type { Metadata } from "next";
import { pageMetadata, SITE_NAME, SITE_URL } from "@/shared/seo";

export const metadata: Metadata = pageMetadata({
  path: "/faq",
  title: "FAQ",
  description:
    "Answers about CallMe2Serve sign-in, payments, shops on the map, packages, referrals, and how the platform works.",
  keywords: ["CallMe2Serve FAQ", "local experts help", "how payment works"],
});

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I need a password?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Experts use Google or Facebook, then fingerprint or face on the device. Desk signs in with email only.",
      },
    },
    {
      "@type": "Question",
      name: "How does payment work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Asker sends quotation and visit fee. Worker accepts. Asker pays digitally. Cash is disabled and receipts are automatic.",
      },
    },
    {
      "@type": "Question",
      name: "When does a shop appear on the map?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Only when the shop has a live GPS pin and a door photo.",
      },
    },
  ],
  url: `${SITE_URL}/faq`,
  isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
      />
      {children}
    </>
  );
}
