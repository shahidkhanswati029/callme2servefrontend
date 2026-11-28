import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import urLocale from "i18n-iso-countries/langs/ur.json";
import arLocale from "i18n-iso-countries/langs/ar.json";
import faLocale from "i18n-iso-countries/langs/fa.json";
import jaLocale from "i18n-iso-countries/langs/ja.json";
import countryToCurrencyModule from "country-to-currency";

/** Next/ESM sometimes wraps JSON/CJS as `{ default: actual }`. */
function unwrap<T>(mod: T | { default: T }): T {
  if (mod && typeof mod === "object" && "default" in (mod as object)) {
    return (mod as { default: T }).default ?? (mod as T);
  }
  return mod as T;
}

type LocalePack = { locale: string; countries: Record<string, string | string[]> };

for (const pack of [enLocale, urLocale, arLocale, faLocale, jaLocale]) {
  countries.registerLocale(unwrap(pack as LocalePack) as never);
}

const currencyMap = unwrap(
  countryToCurrencyModule as Record<string, string> | { default: Record<string, string> },
) as Record<string, string>;

export type CountryOption = {
  code: string;
  name: string;
  currency: string;
};

/** Map app UI language → i18n-iso-countries locale (Punjabi falls back to Urdu). */
export function countriesLocaleFor(lang: string): string {
  if (lang === "ur" || lang === "pa") return "ur";
  if (lang === "ar") return "ar";
  if (lang === "fa") return "fa";
  if (lang === "ja") return "ja";
  return "en";
}

export function countryName(code: string, lang = "en"): string {
  const normalized = String(code || "")
    .trim()
    .toUpperCase();
  if (!normalized) return "";
  const locale = countriesLocaleFor(lang);
  const localized =
    countries.getName(normalized, locale, { select: "official" }) ||
    countries.getName(normalized, "en", { select: "official" });
  return localized || normalized;
}

export function listCountries(lang = "en"): CountryOption[] {
  const locale = countriesLocaleFor(lang);
  const names =
    countries.getNames(locale, { select: "official" }) ||
    countries.getNames("en", { select: "official" }) ||
    {};
  return Object.entries(names)
    .map(([code, name]) => ({
      code,
      name: Array.isArray(name) ? name[0] : name,
      currency: currencyMap[code] || "USD",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

export function currencyForCountry(code: string): string {
  return currencyMap[String(code || "").trim().toUpperCase()] || "USD";
}
