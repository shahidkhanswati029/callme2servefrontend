import type { Metadata } from "next";

/** Prefer production SITE_URL; falls back to the live Vercel host. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://callme2serve1.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "CallMe2Serve";

export const DEFAULT_TITLE =
  "CallMe2Serve · Find trusted local experts near you";

export const DEFAULT_DESCRIPTION =
  "Find trusted local experts with live GPS pins near you in Pakistan and worldwide. Search tutors, makers, shops, and more — ask for work, chat in-app, and get real receipts.";

export const SEO_KEYWORDS = [
  "CallMe2Serve",
  "local experts near me",
  "find experts Pakistan",
  "hire tutor near me",
  "surgical instrument maker",
  "leather jacket maker",
  "local services marketplace",
  "GPS experts map",
  "nearby shops",
  "Sialkot experts",
  "Lahore experts",
  "Islamabad experts",
  "Karachi experts",
  "ask for work nearby",
  "expert quotation bids",
];

export function absoluteUrl(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p === "/" ? "" : p}` || SITE_URL;
}

export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(input.path);
  const title = input.title;
  const description = input.description;
  return {
    title,
    description,
    keywords: [...SEO_KEYWORDS, ...(input.keywords || [])],
    alternates: { canonical: input.path },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: `${title} · ${SITE_NAME}`,
      description,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE_NAME}`,
      description,
    },
    robots: input.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}
