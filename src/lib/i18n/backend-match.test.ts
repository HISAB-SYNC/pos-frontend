import assert from "node:assert/strict";
import { test } from "node:test";

import { matchBackendText, translateBackendText } from "./backend-match.ts";

const t = (key: string, vars?: Record<string, string | number>) =>
  `${key}${vars && Object.keys(vars).length ? " " + JSON.stringify(vars) : ""}`;

test("known backend errors map to message keys", () => {
  assert.equal(matchBackendText("Invalid email or password")?.key, "backend.badCredentials");
  assert.equal(matchBackendText("Nothing is owed to this supplier")?.key, "backend.nothingOwed");
  assert.equal(matchBackendText("Debt is already fully paid")?.key, "backend.debtAlreadyPaid");
});

test("errors with numbers keep their values", () => {
  assert.deepEqual(matchBackendText("Payment is more than what is owed (3600 ETB)"), {
    key: "backend.payMoreThanOwed",
    vars: { amount: "3600" },
  });
  assert.deepEqual(matchBackendText("Can't remove 5: only 2 in stock")?.vars, { quantity: "5", before: "2" });
  assert.deepEqual(matchBackendText("A product with SKU 'SKU-1' already exists in this shop")?.vars, { sku: "SKU-1" });
});

test("notification titles and messages are matched", () => {
  assert.equal(matchBackendText("Low Stock Alert: Milk")?.key, "notice.lowStock.title");
  assert.deepEqual(matchBackendText("Milk (SKU: SKU-9) has 3 pcs remaining (threshold: 5).")?.vars, {
    name: "Milk",
    sku: "SKU-9",
    qty: "3",
    unit: "pcs",
    threshold: "5",
  });
  assert.equal(
    matchBackendText("Debt of 1,200 ETB for customer B13 1304 was due on 11/10/2026.")?.key,
    "notice.overdueDebt.message",
  );
  assert.equal(
    matchBackendText(
      "Fogg role (SKU: SKU-1) sells for 750 ETB, the same as its buying price, so it makes no profit. If that's on purpose, confirm it in the product's edit form; otherwise raise the selling price.",
    )?.key,
    "notice.sellsAtCost.message",
  );
});

test("unknown text is returned unchanged", () => {
  assert.equal(translateBackendText("Something totally new", t), "Something totally new");
  assert.equal(translateBackendText("", t), "");
  assert.equal(translateBackendText(null, t), "");
});
