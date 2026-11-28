import type { Metadata } from "next";
import { pageMetadata } from "@/shared/seo";

export const metadata: Metadata = pageMetadata({
  path: "/contact",
  title: "Contact",
  description:
    "Contact CallMe2Serve support for questions, city requests, or complaints. We help people find trusted local experts.",
  keywords: ["contact CallMe2Serve", "support", "request a city"],
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
