/**
 * Free open-source style i18n (no paid service).
 *
 * UI copy  → src/shared/locales/{lang}.json
 * DB labels → canonical English in DB + db-aliases.json → locale keys
 *
 * tDynamic also auto-translates free-form English word/phrase-by-phrase by
 * reverse-looking up en.json values and aliases (no per-string hardcoding).
 *
 * Public API: t, tDynamic, tExpertCard, canonicalizeCity, …
 */
import enJson from "./locales/en.json";
import urJson from "./locales/ur.json";
import paJson from "./locales/pa.json";
import arJson from "./locales/ar.json";
import faJson from "./locales/fa.json";
import jaJson from "./locales/ja.json";
import aliasesJson from "./locales/db-aliases.json";

export type UiLanguage = "en" | "ur" | "pa" | "ar" | "fa" | "ja";

/** Webpack / Node JSON interop — sometimes the payload is under `.default`. */
function unwrapJson<T extends object>(mod: T | { default: T }): T {
  if (
    mod &&
    typeof mod === "object" &&
    "default" in mod &&
    (mod as { default: unknown }).default &&
    typeof (mod as { default: unknown }).default === "object"
  ) {
    return (mod as { default: T }).default;
  }
  return mod as T;
}

type AliasFile = {
  cities: Record<string, string>;
  canonicalCities: Record<string, string>;
  labels: Record<string, string>;
};

const en = unwrapJson(enJson) as Record<string, string>;
const ur = unwrapJson(urJson) as Record<string, string>;
const pa = unwrapJson(paJson) as Record<string, string>;
const ar = unwrapJson(arJson) as Record<string, string>;
const fa = unwrapJson(faJson) as Record<string, string>;
const ja = unwrapJson(jaJson) as Record<string, string>;
const aliases = unwrapJson(aliasesJson) as AliasFile;

const dict: Record<UiLanguage, Record<string, string>> = { en, ur, pa, ar, fa, ja };

const CITY_ALIASES: Record<string, string> = aliases?.cities || {};
const CANONICAL_CITY: Record<string, string> = aliases?.canonicalCities || {};
const DYNAMIC_MAP: Record<string, string> = aliases?.labels || {};

const CITY_ALIAS_TO_LABEL: Record<string, string> = {};
for (const [alias, localeKey] of Object.entries(CITY_ALIASES)) {
  if (/^[\x00-\x7F]+$/.test(alias)) {
    CITY_ALIAS_TO_LABEL[alias.toLowerCase()] = localeKey;
  }
}

const WORD_MAP: Record<string, string> = {
  ...DYNAMIC_MAP,
  ...CITY_ALIAS_TO_LABEL,
};

const PHRASE_MAP: Array<{ match: RegExp; key: string }> = [
  { match: /surgical\s+instrument/, key: "workSurgicalMaker" },
  { match: /leather\s+jackets?/, key: "workLeatherJackets" },
  { match: /^leather$/, key: "workLeather" },
];

function normKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

/** English UI value → locale key, so DB/UI English text auto-maps without per-string hardcoding. */
const EN_VALUE_TO_KEY: Record<string, string> = {};
const EN_KEYS = new Set(Object.keys(en));
for (const [key, value] of Object.entries(en)) {
  if (!value || typeof value !== "string") continue;
  const folded = normKey(value);
  if (!folded) continue;
  // Prefer first write for collisions.
  if (!EN_VALUE_TO_KEY[folded]) EN_VALUE_TO_KEY[folded] = key;
}

function tImpl(lang: UiLanguage, key: string): string {
  if (lang === "en") return dict.en[key] || key;
  return dict[lang]?.[key] || dict.en[key] || key;
}

/** Resolve one token/phrase to a locale key, if known. */
function resolveLocaleKey(token: string): string | null {
  const raw = token.trim();
  if (!raw) return null;
  if (EN_KEYS.has(raw)) return raw;

  const n = normKey(raw);
  if (!n) return null;

  const cityLocale =
    CITY_ALIASES[raw] || CITY_ALIASES[n] || CITY_ALIASES[n.replace(/\s+/g, "")];
  if (cityLocale) return cityLocale;

  if (DYNAMIC_MAP[n]) return DYNAMIC_MAP[n];
  const compact = n.replace(/\s+/g, "");
  if (DYNAMIC_MAP[compact]) return DYNAMIC_MAP[compact];
  if (WORD_MAP[n]) return WORD_MAP[n];
  if (EN_VALUE_TO_KEY[n]) return EN_VALUE_TO_KEY[n];

  for (const p of PHRASE_MAP) {
    if (p.match.test(n)) return p.key;
  }
  return null;
}

/**
 * Translate a free-form English (or mixed) string using locale dictionaries:
 * longest phrase match first, then word-by-word — no per-string hardcoding required
 * as long as the English wording exists in en.json / aliases.
 */
function autoTranslateText(lang: UiLanguage, text: string): string {
  if (lang === "en") return text;

  const wholeKey = resolveLocaleKey(text);
  if (wholeKey) return tImpl(lang, wholeKey);

  // Keep punctuation / separators; translate alphabetic runs.
  const parts = text.split(/([^\p{L}\p{N}']+)/u);
  const wordsOnly = parts.filter((p) => /[\p{L}\p{N}]/u.test(p));
  if (wordsOnly.length === 0) return text;

  // Greedy longest n-gram match over word tokens (max 6 words).
  const wordIdx: number[] = [];
  parts.forEach((p, i) => {
    if (/[\p{L}\p{N}]/u.test(p)) wordIdx.push(i);
  });

  const out = parts.slice();
  let wi = 0;
  while (wi < wordIdx.length) {
    let matched = false;
    const maxN = Math.min(6, wordIdx.length - wi);
    for (let n = maxN; n >= 1; n -= 1) {
      const start = wordIdx[wi];
      const end = wordIdx[wi + n - 1];
      const slice = parts.slice(start, end + 1).join("");
      const key = resolveLocaleKey(slice);
      if (key) {
        out[start] = tImpl(lang, key);
        for (let j = start + 1; j <= end; j += 1) out[j] = "";
        wi += n;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Single word: try as-is; leave unknown words unchanged.
      wi += 1;
    }
  }
  return out.join("");
}

function canonicalizeCityImpl(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const trimmed = raw.trim();
  const folded = trimmed.toLowerCase().replace(/\s+/g, " ");
  if (CANONICAL_CITY[folded]) return CANONICAL_CITY[folded];
  const localeKey = CITY_ALIASES[trimmed] || CITY_ALIASES[folded];
  if (localeKey) {
    for (const [canonKey, enName] of Object.entries(CANONICAL_CITY)) {
      if (CITY_ALIASES[canonKey] === localeKey) return enName;
    }
  }
  if (/^[\x00-\x7F]+$/.test(trimmed)) {
    return trimmed
      .split(/\s+/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ");
  }
  return trimmed;
}

function mergeCitiesByCanonicalImpl<
  T extends { city: string; experts: number; shops: number },
>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of rows) {
    const city = canonicalizeCityImpl(row.city) || row.city;
    const key = city.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      map.set(key, {
        ...prev,
        city,
        experts: prev.experts + row.experts,
        shops: Math.max(prev.shops, row.shops),
      });
    } else {
      map.set(key, { ...row, city });
    }
  }
  return [...map.values()].sort((a, b) => b.experts - a.experts || a.city.localeCompare(b.city));
}

function tDynamicImpl(lang: UiLanguage, value: string | null | undefined): string {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/\s[-–—]\s/.test(raw)) {
    return raw
      .split(/\s[-–—]\s/)
      .map((part) => tDynamicImpl(lang, part.trim()))
      .join(" · ");
  }
  if (raw.includes(",") && raw.length > 3) {
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      return parts.map((p) => tDynamicImpl(lang, p)).join(", ");
    }
  }
  const countryKey = `country${raw.toUpperCase()}`;
  if (dict.en[countryKey]) return tImpl(lang, countryKey);

  if (lang === "en") {
    const canon = canonicalizeCityImpl(raw);
    if (canon && canon !== raw && /^[\x00-\x7F]+$/.test(canon)) return canon;
    return raw;
  }

  // Auto word/phrase translation from locale dictionaries + aliases (no per-string hardcoding).
  return autoTranslateText(lang, raw);
}

function tExpertCardImpl(
  lang: UiLanguage,
  expert: {
    work?: string | null;
    city?: string | null;
    placeLabel?: string | null;
    package?: string | null;
  },
): string {
  if (expert.work?.trim()) {
    return [tDynamicImpl(lang, expert.work), tDynamicImpl(lang, expert.city)]
      .filter(Boolean)
      .join(" · ");
  }
  if (expert.placeLabel?.trim()) {
    return tDynamicImpl(lang, expert.placeLabel);
  }
  return [tImpl(lang, "experts"), tDynamicImpl(lang, expert.city)].filter(Boolean).join(" · ");
}

function isRtlImpl(lang: UiLanguage): boolean {
  return lang === "ur" || lang === "pa" || lang === "ar" || lang === "fa";
}

function isUiLanguageImpl(v: string): v is UiLanguage {
  return v === "en" || v === "ur" || v === "pa" || v === "ar" || v === "fa" || v === "ja";
}

const LANG_LABELS_EN: Record<UiLanguage, string> = {
  en: "English",
  ur: "Urdu",
  pa: "Punjabi",
  ar: "Arabic",
  fa: "Persian",
  ja: "Japanese",
};

const LANG_LABELS_NATIVE: Record<UiLanguage, string> = {
  en: "English",
  ur: "اردو",
  pa: "پنجابی",
  ar: "العربية",
  fa: "فارسی",
  ja: "日本語",
};

function getUiLanguageOptionsImpl(
  currentLang: UiLanguage = "en",
): Array<{ code: UiLanguage; label: string }> {
  const labels = currentLang === "en" ? LANG_LABELS_EN : LANG_LABELS_NATIVE;
  return (Object.keys(LANG_LABELS_EN) as UiLanguage[]).map((code) => ({
    code,
    label: labels[code],
  }));
}

/** Stable named exports — const bindings avoid intermittent Webpack “is not a function”. */
export const t = tImpl;
export const tDynamic = tDynamicImpl;
export const tExpertCard = tExpertCardImpl;
export const canonicalizeCity = canonicalizeCityImpl;
export const mergeCitiesByCanonical = mergeCitiesByCanonicalImpl;
export const isRtl = isRtlImpl;
export const isUiLanguage = isUiLanguageImpl;
export const getUiLanguageOptions = getUiLanguageOptionsImpl;
export const UI_LANGUAGE_OPTIONS = getUiLanguageOptionsImpl("en");
