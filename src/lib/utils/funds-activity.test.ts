import assert from "node:assert/strict";
import { test } from "node:test";

import { daysAgo, filterByDirection, groupByDay, mergeTransfers, sumInOut } from "./funds-activity.ts";

type Entry = Parameters<typeof mergeTransfers>[0][number];

const entry = (over: Partial<Entry> & { id: string }): Entry => ({
  line: "sales",
  direction: "IN",
  account: "CASH_DRAWER",
  amount: 100,
  date: "2026-11-14T10:00:00.000Z",
  label: "x",
  ...over,
});

const transferOut = entry({ id: "transfer-out:t1", line: "transferOut", direction: "OUT", account: "CASH_DRAWER", amount: 500 });
const transferIn = entry({ id: "transfer-in:t1", line: "transferIn", direction: "IN", account: "BANK", amount: 500 });

test("the two halves of a transfer become one row", () => {
  const rows = mergeTransfers([entry({ id: "sale:1" }), transferOut, transferIn, entry({ id: "sale:2" })]);
  assert.equal(rows.length, 3);
  const transfer = rows[1];
  assert.equal(transfer.kind, "transfer");
  if (transfer.kind === "transfer") {
    assert.equal(transfer.from, "CASH_DRAWER");
    assert.equal(transfer.to, "BANK");
    assert.equal(transfer.amount, 500);
  }
});

test("a transfer half without its partner stays a normal row", () => {
  const rows = mergeTransfers([transferIn]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].kind, "entry");
});

test("direction chips", () => {
  const rows = mergeTransfers([
    entry({ id: "sale:1" }),
    entry({ id: "expense:1", line: "expenses", direction: "OUT" }),
    transferOut,
    transferIn,
  ]);
  assert.deepEqual(filterByDirection(rows, "IN").map((r) => r.id), ["sale:1"]);
  assert.deepEqual(filterByDirection(rows, "OUT").map((r) => r.id), ["expense:1"]);
  assert.deepEqual(filterByDirection(rows, "MOVED").map((r) => r.id), ["transfer:t1"]);
  assert.equal(filterByDirection(rows, "ALL").length, 3);
});

test("a lone transfer half is both money in/out for the account and a move", () => {
  const rows = mergeTransfers([transferIn]);
  assert.equal(filterByDirection(rows, "IN").length, 1);
  assert.equal(filterByDirection(rows, "MOVED").length, 1);
});

test("in and out totals leave moves between own accounts out", () => {
  const rows = mergeTransfers([
    entry({ id: "sale:1", amount: 250.1 }),
    entry({ id: "sale:2", amount: 0.2 }),
    entry({ id: "expense:1", line: "expenses", direction: "OUT", amount: 100 }),
    transferOut,
    transferIn,
  ]);
  assert.deepEqual(sumInOut(rows), { in: 250.3, out: 100 });
});

test("rows are grouped by local day in order, with a net per day", () => {
  const day1a = new Date(2026, 10, 14, 15, 20).toISOString();
  const day1b = new Date(2026, 10, 14, 9, 5).toISOString();
  const day2 = new Date(2026, 10, 13, 18, 0).toISOString();
  const rows = mergeTransfers([
    entry({ id: "a", date: day1a, amount: 300 }),
    entry({ id: "b", date: day1b, line: "expenses", direction: "OUT", amount: 120 }),
    entry({ id: "c", date: day2, amount: 50 }),
  ]);
  const groups = groupByDay(rows);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((g) => g.rows.length), [2, 1]);
  assert.deepEqual(groups.map((g) => g.net), [180, 50]);
});

test("daysAgo", () => {
  const now = new Date(2026, 10, 15, 8, 0);
  const today = groupByDay(mergeTransfers([entry({ id: "a", date: new Date(2026, 10, 15, 1, 0).toISOString() })]))[0];
  const yesterday = groupByDay(mergeTransfers([entry({ id: "a", date: new Date(2026, 10, 14, 23, 0).toISOString() })]))[0];
  assert.equal(daysAgo(today, now), 0);
  assert.equal(daysAgo(yesterday, now), 1);
});
