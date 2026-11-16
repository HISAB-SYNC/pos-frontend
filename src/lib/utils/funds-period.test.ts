import assert from "node:assert/strict";
import { test } from "node:test";

import { detectPeriod, hasAllRecords, inOutNet, periodRange, sumByLine } from "./funds-period.ts";

const now = new Date(2026, 10, 15, 9, 30); // 15 Nov 2026

test("quick period dates", () => {
  assert.deepEqual(periodRange("TODAY", now), { from: "2026-11-15", to: "2026-11-15" });
  assert.deepEqual(periodRange("WEEK", now), { from: "2026-11-09", to: "2026-11-15" });
  assert.deepEqual(periodRange("MONTH", now), { from: "2026-11-01", to: "2026-11-15" });
  assert.deepEqual(periodRange("ALL", now), { from: "", to: "" });
  assert.deepEqual(periodRange("CUSTOM", now, { from: "2026-10-01", to: "2026-10-31" }), { from: "2026-10-01", to: "2026-10-31" });
});

test("the week reaches back across a month boundary", () => {
  const early = new Date(2026, 10, 3);
  assert.deepEqual(periodRange("WEEK", early), { from: "2026-10-28", to: "2026-11-03" });
});

test("dates map back to the quick choice, otherwise custom", () => {
  assert.equal(detectPeriod({ from: "", to: "" }, now), "ALL");
  assert.equal(detectPeriod({ from: "2026-11-15", to: "2026-11-15" }, now), "TODAY");
  assert.equal(detectPeriod({ from: "2026-11-09", to: "2026-11-15" }, now), "WEEK");
  assert.equal(detectPeriod({ from: "2026-11-01", to: "2026-11-15" }, now), "MONTH");
  assert.equal(detectPeriod({ from: "2026-11-02", to: "2026-11-15" }, now), "CUSTOM");
  assert.equal(detectPeriod({ from: "2026-11-02", to: "" }, now), "CUSTOM");
});

test("totals per line and in/out/net leave moves between own accounts out", () => {
  const lines = sumByLine([
    { line: "sales", amount: 250.1 },
    { line: "sales", amount: 0.2 },
    { line: "repayments", amount: 100 },
    { line: "expenses", amount: 120.5 },
    { line: "supplierPayments", amount: 30 },
    { line: "transferIn", amount: 999 },
    { line: "transferOut", amount: 999 },
  ]);
  assert.equal(lines.sales, 250.3);
  assert.deepEqual(inOutNet(lines), { in: 350.3, out: 150.5, net: 199.8 });
});

test("records are complete only when the server sent all of them", () => {
  assert.equal(hasAllRecords({ count: 3, items: [1, 2, 3] }), true);
  assert.equal(hasAllRecords({ count: 700, items: new Array(500) }), false);
});
