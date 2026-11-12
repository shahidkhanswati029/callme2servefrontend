import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import countryToCurrencyModule from "country-to-currency";

/** Next/ESM sometimes wraps JSON/CJS as `{ default: actual }`. */
function unwrap<T>(mod: T | { default: T }): T {
  if (mod && typeof mod === "object" && "default" in (mod as object)) {
    return (mod as { default: T }).default ?? (mod as T);
  }
  return mod as T;
}

const en = unwrap(enLocale as { locale: string; countries: Record<string, string | string[]> });
countries.registerLocale(en as never);

const currencyMap = unwrap(
  countryToCurrencyModule as Record<string, string> | { default: Record<string, string> },
) as Record<string, string>;

export type CountryOption = {
  code: string;
  name: string;
  currency: string;
};

export function listCountries(): CountryOption[] {
  const names = countries.getNames("en", { select: "official" }) || {};
  return Object.entries(names)
    .map(([code, name]) => ({
      code,
      name,
      currency: currencyMap[code] || "USD",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function currencyForCountry(code: string): string {
  return currencyMap[code] || "USD";
}
