"use client";

import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function MarketingShell({
  children,
  supportBanner = true,
}: {
  children: React.ReactNode;
  supportBanner?: boolean;
}) {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <SiteHeader supportBanner={supportBanner} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
