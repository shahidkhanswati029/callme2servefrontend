import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://callme2serve.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/desk/", "/api/", "/inbox/", "/account", "/earnings", "/jobs"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
