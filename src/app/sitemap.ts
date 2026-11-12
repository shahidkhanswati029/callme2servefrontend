import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://callme2serve.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/categories",
    "/search",
    "/cities",
    "/how-it-works",
    "/faq",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/login",
  ];
  const now = new Date();
  return paths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}