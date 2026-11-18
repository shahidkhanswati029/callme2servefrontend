# CallMe2Serve i18n (free)

No paid translation service is required.

## UI text

- Files: `en.json`, `ur.json`, `pa.json`, `ar.json`, `fa.json`, `ja.json`
- Use keys via `t(lang, "home")` — never hardcode button/menu copy in components when a key exists.

## Database / dynamic content

Best practice used here:

1. **Store English (canonical) values** in PostgreSQL (`city`, `work`, status enums, package names).
2. **Translate on display** with `tDynamic(lang, value)` using `db-aliases.json` → locale JSON.
3. User-generated free text (reviews, chat) stays in the author’s language unless you later add a paid API.

Do **not** store parallel Urdu/English city rows in the DB — that duplicates cards. Canonicalize on write (`canonicalizeCity`).

## Adding a string

1. Add the key to `en.json`.
2. Add overrides in other locale files as needed (missing keys fall back to English).
3. For a new DB city/category, add aliases in `db-aliases.json` and the `city*` / `cat*` keys in locale files.
