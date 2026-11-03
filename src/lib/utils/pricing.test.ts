import assert from "node:assert/strict";
import { test } from "node:test";

import { checkPrices, confirmFlags, marginOf } from "./pricing.ts";

const codes = (issues: Array<{ code: string }>) => issues.map((i) => i.code);

test("normal prices pass", () => {
  assert.deepEqual(checkPrices({ price: 70, buyingPrice: 54 }), []);
  assert.deepEqual(checkPrices({ price: 70, buyingPrice: 54, previousPrice: 70, previousBuyingPrice: 50 }), []);
  assert.deepEqual(checkPrices({ price: 70, buyingPrice: 0 }), [], "no buying price yet");
});

test("swapped prices are caught (Mini Chocolate)", () => {
  assert.deepEqual(codes(checkPrices({ price: 15, buyingPrice: 20 })), ["PRICE_BELOW_COST"]);
  assert.deepEqual(codes(checkPrices({ price: 20, buyingPrice: 20 })), ["PRICE_BELOW_COST"], "no profit at all");
});

test("typo jumps are caught (Enjira 54 -> 3,940)", () => {
  const issues = checkPrices({ price: 70, buyingPrice: 3940, previousPrice: 70, previousBuyingPrice: 54 });
  assert.ok(codes(issues).includes("PRICE_UNUSUAL_CHANGE"));
  assert.ok(codes(issues).includes("PRICE_BELOW_COST"));
  assert.match(issues.find((i) => i.code === "PRICE_UNUSUAL_CHANGE")!.message, /73× higher/);
  assert.deepEqual(codes(checkPrices({ price: 7, buyingPrice: 5.4, previousPrice: 70, previousBuyingPrice: 54 })), [
    "PRICE_UNUSUAL_CHANGE",
    "PRICE_UNUSUAL_CHANGE",
  ]);
});

test("huge markup is caught (egg 23.5 -> sold at 250)", () => {
  assert.deepEqual(codes(checkPrices({ price: 250, buyingPrice: 23.5 })), ["PRICE_UNUSUAL_MARGIN"]);
  assert.deepEqual(checkPrices({ price: 100, buyingPrice: 20 }), [], "exactly 5× is allowed");
});

test("confirm flags match the accepted issues", () => {
  assert.deepEqual(confirmFlags([{ code: "PRICE_BELOW_COST" }]), { confirmBelowCost: true, confirmUnusualPrice: undefined });
  assert.deepEqual(confirmFlags([{ code: "PRICE_UNUSUAL_CHANGE" }]), { confirmBelowCost: undefined, confirmUnusualPrice: true });
  assert.deepEqual(confirmFlags([]), { confirmBelowCost: undefined, confirmUnusualPrice: undefined });
});

test("marginOf", () => {
  assert.deepEqual(marginOf(70, 54), { profit: 16, marginPct: 22.9 });
  assert.equal(marginOf(70, 0), null);
});
