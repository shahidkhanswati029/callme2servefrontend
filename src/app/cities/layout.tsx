import type { Metadata } from "next";
import { pageMetadata } from "@/shared/seo";

export const metadata: Metadata = pageMetadata({
  path: "/cities",
  title: "Cities we serve",
  description:
    "Explore CallMe2Serve cities with live expert pins — Sialkot, Islamabad, Lahore, Karachi, and growing cities worldwide.",
  keywords: [
    "experts by city",
    "Sialkot experts",
    "Lahore experts",
    "Islamabad experts",
    "Karachi experts",
  ],
});

export default function CitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
