import type { Metadata } from "next";
import { pageMetadata } from "@/shared/seo";

export const metadata: Metadata = pageMetadata({
  path: "/privacy",
  title: "Privacy policy",
  description:
    "Privacy policy for CallMe2Serve. Learn how account, place, chat, and ledger data are handled.",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
