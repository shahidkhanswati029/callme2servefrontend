import type { Metadata } from "next";
import { pageMetadata } from "@/shared/seo";

export const metadata: Metadata = pageMetadata({
  path: "/terms",
  title: "Terms of service",
  description: "Terms of service for using CallMe2Serve — the local experts marketplace.",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
