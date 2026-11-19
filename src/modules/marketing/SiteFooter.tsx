"use client";

import Link from "next/link";
import { BrandMark } from "@/modules/identity/components/BrandMark";
import { useAppSelector } from "@/store/hooks";
import { t } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

const SOCIAL = [
  {
    key: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
      </svg>
    ),
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
      </svg>
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zm5.75-3.25a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1z" />
      </svg>
    ),
  },
  {
    key: "x",
    label: "X",
    href: "https://x.com/",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M18.9 2H22l-6.78 7.75L23 22h-6.4l-5-6.55L5.9 22H2.1l7.25-8.28L1 2h6.55l4.52 5.98L18.9 2zm-1.12 18h1.78L6.35 3.9H4.44L17.78 20z" />
      </svg>
    ),
  },
] as const;

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
          <div className="mt-4 flex gap-2">
            {SOCIAL.map((s) => (
              <a
                key={s.key}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="cmts-press grid h-9 w-9 place-items-center rounded-full border border-white/20 text-[#d5e0d8] transition-colors hover:border-brass hover:text-brass"
              >
                {s.icon}
              </a>
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
