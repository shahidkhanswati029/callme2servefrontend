import type { Metadata } from "next";
import { pageMetadata } from "@/shared/seo";

export const metadata: Metadata = pageMetadata({
  path: "/how-it-works",
  title: "How it works",
  description:
    "See how CallMe2Serve works: open an expert seat, drop a live place pin, ask or accept jobs, chat in-app, and get a real receipt.",
  keywords: ["how CallMe2Serve works", "hire local experts", "expert quotation"],
});

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
