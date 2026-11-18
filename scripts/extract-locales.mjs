import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, "../src/shared/i18n.ts");
const outDir = path.join(__dirname, "../src/shared/locales");
const src = fs.readFileSync(srcPath, "utf8");

function extractBody(name) {
  const marker = `const ${name}: Record<string, string> = {`;
  const start = src.indexOf(marker);
  if (start < 0) throw new Error(`missing ${name}`);
  let i = start + marker.length;
  let depth = 1;
  let body = "";
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) break;
    }
    if (depth >= 1) body += ch;
    i += 1;
  }
  return body;
}

fs.mkdirSync(outDir, { recursive: true });

const en = new Function(`return ({${extractBody("en")}});`)();
fs.writeFileSync(path.join(outDir, "en.json"), `${JSON.stringify(en, null, 2)}\n`);
console.log("en", Object.keys(en).length, "keys");

for (const lang of ["ur", "pa", "ar", "fa", "ja"]) {
  const body = extractBody(lang).replace(/^\s*\.\.\.en\s*,/, "");
  const overrides = new Function(`return ({${body}});`)();
  const merged = { ...en, ...overrides };
  fs.writeFileSync(path.join(outDir, `${lang}.json`), `${JSON.stringify(merged, null, 2)}\n`);
  console.log(lang, Object.keys(merged).length, "keys", `(${Object.keys(overrides).length} overrides)`);
}
