// npm run i18n:check
// Lists text that is still missing in Amharic or Afaan Oromo, translations that
// have no English key, and {placeholders} that don't match the English text.
// Exits with an error only for problems (unknown keys, wrong placeholders), not
// for text that is simply not translated yet; pass --strict to fail on that too.
import { loadAreas } from "./i18n-lib.mjs";

const strict = process.argv.includes("--strict");
const areas = await loadAreas();
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

let problems = 0;
let missingTotal = 0;
let total = 0;
const seen = new Map();

for (const area of areas) {
  const keys = Object.keys(area.en);
  total += keys.length;
  for (const key of keys) {
    if (seen.has(key)) {
      console.log(`DUPLICATE KEY ${key} (in ${seen.get(key)} and ${area.file})`);
      problems++;
    }
    seen.set(key, area.file);
  }
  for (const lang of ["am", "om"]) {
    const dict = area[lang];
    const missing = keys.filter((k) => !dict[k]);
    missingTotal += missing.length;
    if (missing.length) {
      console.log(`\n${area.file}: ${missing.length} not translated to ${lang === "am" ? "Amharic" : "Afaan Oromo"}`);
      for (const k of missing.slice(0, 15)) console.log(`   ${k}  "${area.en[k]}"`);
      if (missing.length > 15) console.log(`   ...and ${missing.length - 15} more`);
    }
    for (const k of Object.keys(dict)) {
      if (!(k in area.en)) {
        console.log(`UNKNOWN KEY in ${area.file} (${lang}): ${k}`);
        problems++;
      } else if (dict[k] && placeholders(dict[k]) !== placeholders(area.en[k])) {
        console.log(`PLACEHOLDERS differ in ${area.file} (${lang}) ${k}: "${area.en[k]}" vs "${dict[k]}"`);
        problems++;
      }
    }
  }
}

console.log(`\n${total} English keys · ${missingTotal} missing translations (Amharic + Afaan Oromo) · ${problems} problems`);
if (problems > 0 || (strict && missingTotal > 0)) process.exit(1);
