import assert from "node:assert/strict";
import { test } from "node:test";

import { balanceAfter, lineTotal, percentChange, roundMoney, shortfall, sumMoney } from "./money.ts";

test("roundMoney removes float noise", () => {
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
  assert.equal(roundMoney(1.005), 1.01);
  assert.equal(roundMoney(-150.004), -150);
});

test("lineTotal handles fractional quantities (kg)", () => {
  assert.equal(lineTotal(1.5, 60), 90);
  assert.equal(lineTotal(0.333, 100), 33.3);
  assert.equal(lineTotal(50, 60), 3000);
});

test("shortfall: what the account can't cover", () => {
  assert.equal(shortfall(800, 3000), 2200);
  assert.equal(shortfall(3000, 3000), 0);
  assert.equal(shortfall(5000, 3000), 0);
  assert.equal(shortfall(null, 3000), 0, "unknown balance never asks for extra money");
  assert.equal(shortfall(-500, 1000), 1500, "a negative balance needs the full gap");
});

test("balanceAfter: restock of 3000 from a till showing 800", () => {
  assert.equal(balanceAfter(800, 3000), -2200, "before the shortfall is explained");
  assert.equal(balanceAfter(800, 3000, shortfall(800, 3000)), 0, "after adding the owner's money");
  assert.equal(balanceAfter(null, 3000), null);
});

test("supplier payment preview: 700 of 1,200 owed from a bank showing 500", () => {
  const added = shortfall(500, 700);
  assert.equal(added, 200);
  assert.equal(balanceAfter(500, 700, added), 0);
  assert.equal(roundMoney(1200 - 700), 500, "still owed");
});

test("percentChange for the KPI comparison", () => {
  assert.equal(percentChange(1500, 1000), 50);
  assert.equal(percentChange(500, 1000), -50);
  assert.equal(percentChange(1500, 0), null, "no previous sales: no percentage");
});

test("sumMoney adds selected restocks exactly", () => {
  assert.equal(sumMoney([600, 300]), 900);
  assert.equal(sumMoney([0.1, 0.2, 0.3]), 0.6);
});
