import assert from "node:assert/strict";
import { test } from "node:test";

import { matchSuppliers, resolveSupplier } from "./supplier-match.ts";

const suppliers = [
  { id: "1", name: "Mimi dubai" },
  { id: "2", name: "mohammed milk" },
  { id: "3", name: "Samson" },
  { id: "4", name: "Ahmed baltina" },
  { id: "5", name: "Yared" },
];

test("names that start with the text come first, then names that contain it", () => {
  assert.deepEqual(matchSuppliers(suppliers, "m").map((s) => s.name), ["Mimi dubai", "mohammed milk", "Ahmed baltina", "Samson"]);
  assert.deepEqual(matchSuppliers(suppliers, "mo").map((s) => s.name), ["mohammed milk"]);
  assert.deepEqual(matchSuppliers(suppliers, "MOH").map((s) => s.name), ["mohammed milk"]);
});

test("empty text lists everyone A to Z, limited", () => {
  assert.deepEqual(matchSuppliers(suppliers, "").map((s) => s.name), ["Ahmed baltina", "Mimi dubai", "mohammed milk", "Samson", "Yared"]);
  assert.equal(matchSuppliers(suppliers, "", 2).length, 2);
});

test("no match returns nothing", () => {
  assert.deepEqual(matchSuppliers(suppliers, "zzz"), []);
});

test("typed text resolves to an existing supplier regardless of case and spaces", () => {
  assert.deepEqual(resolveSupplier(suppliers, "  MIMI DUBAI "), { kind: "existing", supplierId: "1", name: "Mimi dubai" });
});

test("unknown text is a new supplier; empty is nothing", () => {
  assert.deepEqual(resolveSupplier(suppliers, "Radet"), { kind: "new", supplierId: null, name: "Radet" });
  assert.equal(resolveSupplier(suppliers, "   "), null);
});
