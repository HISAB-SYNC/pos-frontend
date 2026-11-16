// npm run i18n:export
// Writes i18n-review.csv (key, English, Amharic, Afaan Oromo) so a native
// speaker can review or fill in the wording in a spreadsheet.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { loadAreas, messagesDir } from "./i18n-lib.mjs";

const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const rows = [["Area", "Key", "English", "Amharic", "Afaan Oromo"].map(cell).join(",")];

for (const area of await loadAreas()) {
  for (const key of Object.keys(area.en)) {
    rows.push([area.file.replace(".ts", ""), key, area.en[key], area.am[key] ?? "", area.om[key] ?? ""].map(cell).join(","));
  }
}

const out = join(messagesDir, "..", "..", "..", "..", "i18n-review.csv");
// BOM so Excel opens the Amharic text correctly.
writeFileSync(out, "﻿" + rows.join("\r\n") + "\r\n", "utf8");
console.log(`Wrote ${rows.length - 1} rows to ${out}`);
