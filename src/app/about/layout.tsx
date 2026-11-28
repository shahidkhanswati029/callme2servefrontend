import type { Metadata } from "next";
import { pageMetadata } from "@/shared/seo";

export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: "About",
  description:
    "Learn about CallMe2Serve — a global expert marketplace with live GPS pins, in-app chat, shops, and digital receipts.",
  keywords: ["about CallMe2Serve", "expert marketplace"],
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
