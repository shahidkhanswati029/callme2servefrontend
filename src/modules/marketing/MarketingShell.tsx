"use client";

import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { useUiLanguage } from "@/shared/useUiLanguage";
import { isRtl } from "@/shared/i18n";

export function MarketingShell({
  children,
  supportBanner = true,
}: {
  children: React.ReactNode;
  supportBanner?: boolean;
}) {
  const lang = useUiLanguage();

  return (
    <div
      key={lang}
      lang={lang}
      dir={isRtl(lang) ? "rtl" : "ltr"}
      translate="no"
      className="notranslate min-h-[100dvh] bg-paper text-ink"
    >
      <SiteHeader supportBanner={supportBanner} />
      <main className="animate-page">{children}</main>
      <SiteFooter />
    </div>
  );
}
