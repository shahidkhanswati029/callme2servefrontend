"use client";

import Link from "next/link";
import { BrandMark } from "@/modules/identity/components/BrandMark";
import { useAppSelector } from "@/store/hooks";

export function SiteFooter() {
  const countryCode = useAppSelector((s) => s.uiPrefs.countryCode);
  const currency = useAppSelector((s) => s.uiPrefs.currency);

  return (
    <footer className="bg-forest text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="[&_h1]:text-paper [&_p]:text-brass [&_.bg-forest]:bg-[#14332b]">
            <BrandMark compact />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#d5e0d8]">
            CallMe2Serve connects people with nearby experts — ask for work, open a shop, pay with
            real rails, and keep commission honest.
          </p>
          <p className="mt-3 text-xs font-semibold text-brass">
            {countryCode} · {currency}
          </p>
          <div className="mt-4 flex gap-2 text-xs font-bold">
            {["Fb", "X", "In", "Ig"].map((s) => (
              <span
                key={s}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-[#d5e0d8]"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-brass">Quick links</h3>
          <ul className="mt-3 grid gap-2 text-sm text-[#d5e0d8]">
            <li>
              <Link href="/about" className="hover:text-paper">
                About
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-paper">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-paper">
                Become an expert
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-paper">
                Become an expert / refer
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-paper">
                Categories
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-brass">Support</h3>
          <ul className="mt-3 grid gap-2 text-sm text-[#d5e0d8]">
            <li>
              <Link href="/contact" className="hover:text-paper">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-paper">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-paper">
                Terms of service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-paper">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/desk/login" className="hover:text-paper">
                Desk seat
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-brass">Contact us</h3>
          <ul className="mt-3 grid gap-2 text-sm text-[#d5e0d8]">
            <li>Live experts · global cities</li>
            <li>
              <a href="mailto:hello@callme2serve.com" className="hover:text-paper">
                hello@callme2serve.com
              </a>
            </li>
            <li>
              <Link href="/contact" className="font-semibold text-brass hover:text-paper">
                Send a message →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-[#d5e0d8]">
        © {new Date().getFullYear()} CallMe2Serve. All rights reserved.
      </div>
    </footer>
  );
}
