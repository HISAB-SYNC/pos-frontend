// Shared by i18n-check.mjs and i18n-export.mjs: loads every area file in
// src/lib/i18n/messages (Node strips the TypeScript types itself).
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const messagesDir = join(here, "..", "src", "lib", "i18n", "messages");
const NOT_AREAS = new Set(["index.ts", "types.ts"]);

export async function loadAreas() {
  const files = readdirSync(messagesDir).filter((f) => f.endsWith(".ts") && !NOT_AREAS.has(f)).sort();
  const areas = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(join(messagesDir, file)).href);
    for (const [name, area] of Object.entries(mod)) {
      if (area && typeof area === "object" && "en" in area && "am" in area && "om" in area) {
        areas.push({ file, name, ...area });
      }
    }
  }
  return areas;
}
