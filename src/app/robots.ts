import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/desk/",
          "/inbox/",
          "/home",
          "/account",
          "/earnings",
          "/jobs",
          "/quotations",
          "/quotations/",
          "/portfolio",
          "/shops",
          "/refer",
          "/alarms",
          "/notifications",
          "/settings/",
          "/onboarding/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
