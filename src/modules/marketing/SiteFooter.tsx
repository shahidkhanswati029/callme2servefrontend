"use client";

import Link from "next/link";
import { BrandMark } from "@/modules/identity/components/BrandMark";
import { useAppSelector } from "@/store/hooks";
import { t } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

export function SiteFooter() {
  const lang = useUiLanguage();
  const countryCode = useAppSelector((s) => s.uiPrefs.countryCode);
  const currency = useAppSelector((s) => s.uiPrefs.currency);

  return (
    <footer className="bg-forest text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="[&_h1]:text-paper [&_p]:text-brass [&_.bg-forest]:bg-[#14332b]">
            <BrandMark compact />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#d5e0d8]">{t(lang, "footerLede")}</p>
          <p className="mt-3 text-xs font-semibold text-brass">
            {countryCode} · {currency}
          </p>
          <div className="mt-4 flex gap-2 text-xs font-bold">
            {["Fb", "X", "In", "Ig"].map((s) => (
              <span
                key={s}
                className="cmts-press grid h-9 w-9 place-items-center rounded-full border border-white/20 text-[#d5e0d8]"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-brass">
            {t(lang, "quickLinks")}
          </h3>
          <ul className="mt-3 grid gap-2 text-sm text-[#d5e0d8]">
            <li>
              <Link href="/about" className="hover:text-paper">
                {t(lang, "about")}
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-paper">
                {t(lang, "howItWorks")}
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-paper">
                {t(lang, "becomeExpert")}
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-paper">
                {t(lang, "becomeExpertRefer")}
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-paper">
                {t(lang, "categories")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-brass">
            {t(lang, "support")}
          </h3>
          <ul className="mt-3 grid gap-2 text-sm text-[#d5e0d8]">
            <li>
              <Link href="/contact" className="hover:text-paper">
                {t(lang, "contact")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-paper">
                {t(lang, "faq")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-paper">
                {t(lang, "termsOfService")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-paper">
                {t(lang, "privacyPolicy")}
              </Link>
            </li>
            <li>
              <Link href="/desk/login" className="hover:text-paper">
                {t(lang, "deskSeat")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-brass">
            {t(lang, "contactUs")}
          </h3>
          <ul className="mt-3 grid gap-2 text-sm text-[#d5e0d8]">
            <li>{t(lang, "liveExpertsGlobal")}</li>
            <li>
              <a href="mailto:hello@callme2serve.com" className="hover:text-paper">
                hello@callme2serve.com
              </a>
            </li>
            <li>
              <Link href="/contact" className="font-semibold text-brass hover:text-paper">
                {t(lang, "sendMessage")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-[#d5e0d8]">
        © {new Date().getFullYear()} {t(lang, "brandName")}. {t(lang, "allRightsReserved")}
      </div>
    </footer>
  );
}
