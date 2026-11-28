import type { Metadata } from "next";
import { pageMetadata } from "@/shared/seo";

export const metadata: Metadata = pageMetadata({
  path: "/search",
  title: "Search experts",
  description:
    "Search trusted local experts near you by service and city. Live GPS pins, ratings, and in-app messaging on CallMe2Serve.",
  keywords: ["search experts", "find local services", "experts near me"],
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
