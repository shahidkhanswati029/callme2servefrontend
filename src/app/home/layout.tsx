import type { Metadata } from "next";

/** Private expert dashboard — keep out of Google index. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
