import type { Metadata } from "next";
import { pageMetadata } from "@/shared/seo";

export const metadata: Metadata = pageMetadata({
  path: "/categories",
  title: "Service categories",
  description:
    "Browse CallMe2Serve categories — tutors, surgical makers, leather work, tailors, shops, and more trusted local experts.",
  keywords: [
    "service categories",
    "tutor near me",
    "surgical instrument maker",
    "leather jacket maker",
    "tailor near me",
  ],
});

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
