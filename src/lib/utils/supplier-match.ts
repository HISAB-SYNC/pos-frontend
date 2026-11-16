/**
 * Matching for the supplier type-ahead: which saved suppliers fit the typed
 * text, and whether the text names an existing supplier or a new one.
 */

export type NamedSupplier = { id: string; name: string };

export type SupplierChoice =
  | { kind: "existing"; supplierId: string; name: string }
  | { kind: "new"; supplierId: null; name: string };

const norm = (value: string) => value.trim().toLowerCase();

/** Suppliers whose name starts with the text first, then ones that contain it; each group A–Z. */
export function matchSuppliers<T extends NamedSupplier>(suppliers: T[], text: string, limit = 50): T[] {
  const q = norm(text);
  const byName = (a: T, b: T) => a.name.localeCompare(b.name);
  if (!q) return [...suppliers].sort(byName).slice(0, limit);
  const starts: T[] = [];
  const contains: T[] = [];
  for (const s of suppliers) {
    const name = norm(s.name);
    if (name.startsWith(q)) starts.push(s);
    else if (name.includes(q)) contains.push(s);
  }
  return [...starts.sort(byName), ...contains.sort(byName)].slice(0, limit);
}

/** What the typed text stands for: an existing supplier (exact name, any case), a new one, or nothing. */
export function resolveSupplier(suppliers: NamedSupplier[], text: string): SupplierChoice | null {
  const clean = text.trim();
  if (!clean) return null;
  const exact = suppliers.find((s) => norm(s.name) === norm(clean));
  if (exact) return { kind: "existing", supplierId: exact.id, name: exact.name };
  return { kind: "new", supplierId: null, name: clean };
}
