"use client";

import { Download, Info, RotateCcw, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import {
  ACCOUNT_ICONS,
  ACCOUNT_LABELS,
  ALL_LINES,
  IN_LINES,
  LINE_HINTS,
  LINE_LABELS,
  OUT_LINES,
  formatEtb,
  formatShortDate,
} from "@/components/funds/funds-shared";
import { PaySupplierModal, supplierKey } from "@/components/funds/pay-supplier-modal";
import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
import { getFundsEntries, getFundsSummary, getSupplierPayables, getSupplierPayments } from "@/lib/api/app-data";
import type {
  FundAccount,
  FundsEntries,
  FundsLine,
  FundsSummary,
  SupplierPayables,
  SupplierPayment,
} from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { exportToCsv } from "@/lib/utils/export";
import { useShopStore } from "@/stores/shop-store";

type Tab = "overview" | "ledger" | "suppliers";
type LedgerFilter = { line: FundsLine | ""; account: FundAccount | ""; from: string; to: string };

const EMPTY_FILTER: LedgerFilter = { line: "", account: "", from: "", to: "" };

const selectClass =
  "h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden";

/* ------------------------------------------------------------------ */
/* Overview: money in / out lines and the split per account           */
/* ------------------------------------------------------------------ */
function OverviewTab({ funds, onOpenLine }: { funds: FundsSummary; onOpenLine: (line: FundsLine) => void }) {
  const renderLine = (line: FundsLine, sign: "+" | "−") => (
    <button
      key={line}
      type="button"
      onClick={() => onOpenLine(line)}
      className="group flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-zinc-50"
    >
      <span className="flex items-center gap-1.5 text-xs text-zinc-700">
        {LINE_LABELS[line]}
        <span title={LINE_HINTS[line]} className="text-zinc-300">
          <Info className="size-3" />
        </span>
      </span>
      <span
        className={`font-mono text-sm font-semibold tabular-nums ${
          sign === "+" ? "text-emerald-700" : "text-zinc-900"
        } ${funds.lines[line] === 0 ? "opacity-40" : ""}`}
      >
        {sign} {formatEtb(funds.lines[line])}
      </span>
    </button>
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs lg:col-span-3">
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">Money in and out</h2>
        <p className="mb-3 text-xs text-zinc-500">
          {funds.since ? `Since ${formatShortDate(funds.since)}. ` : ""}Tap a line to see its records.
        </p>
        <p className="px-2 pb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">In</p>
        {IN_LINES.map((line) => renderLine(line, "+"))}
        <p className="mt-2 px-2 pb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Out</p>
        {OUT_LINES.map((line) => renderLine(line, "−"))}
        <div className="mt-2 flex items-center justify-between border-t border-zinc-900 px-2 pt-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">Money left</span>
          <span
            className={`font-mono text-xl font-bold tracking-tight tabular-nums ${
              funds.moneyLeft < 0 ? "text-rose-700" : "text-zinc-900"
            }`}
          >
            {formatEtb(funds.moneyLeft)} <span className="text-xs font-semibold text-zinc-500">ETB</span>
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs lg:col-span-2">
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">By account</h2>
        <p className="mb-3 text-xs text-zinc-500">Card and bank-transfer sales count as Bank.</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              <th className="pb-2 font-bold">Account</th>
              <th className="pb-2 text-right font-bold">In</th>
              <th className="pb-2 text-right font-bold">Out</th>
              <th className="pb-2 text-right font-bold">Left</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {funds.accounts.map((a) => (
              <tr key={a.account}>
                <td className="py-2 text-zinc-700">{a.label}</td>
                <td className="py-2 text-right font-mono tabular-nums text-emerald-700">{formatEtb(a.moneyIn)}</td>
                <td className="py-2 text-right font-mono tabular-nums text-zinc-700">{formatEtb(a.moneyOut)}</td>
                <td
                  className={`py-2 text-right font-mono font-bold tabular-nums ${
                    a.balance < 0 ? "text-rose-700" : "text-zinc-900"
                  }`}
                >
                  {formatEtb(a.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 rounded-md bg-zinc-50 px-3 py-2 text-[11px] leading-relaxed text-zinc-600">
          <span className="font-semibold text-zinc-800">Funds vs profit:</span> Revenue and Net Profit measure how the
          business performs. Funds is the real money you have right now — restocking lowers it straight away, while
          profit only counts goods once they sell.
        </p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ledger: every money movement with filters and CSV export           */
/* ------------------------------------------------------------------ */
function LedgerTab({
  shopId,
  filter,
  onFilterChange,
}: {
  shopId: string;
  filter: LedgerFilter;
  onFilterChange: (filter: LedgerFilter) => void;
}) {
  const [data, setData] = useState<{ key: string; entries: FundsEntries | null; error: boolean } | null>(null);
  const filterKey = JSON.stringify(filter);

  useEffect(() => {
    let mounted = true;
    const from = filter.from ? new Date(`${filter.from}T00:00:00`) : null;
    const to = filter.to ? new Date(`${filter.to}T00:00:00`) : null;
    if (to) to.setDate(to.getDate() + 1); // include the whole "to" day
    getFundsEntries(shopId, {
      line: filter.line || undefined,
      account: filter.account || undefined,
      from: from?.toISOString(),
      to: to?.toISOString(),
      limit: 500,
    })
      .then((entries) => {
        if (mounted) setData({ key: filterKey, entries, error: false });
      })
      .catch(() => {
        if (mounted) setData({ key: filterKey, entries: null, error: true });
      });
    return () => {
      mounted = false;
    };
  }, [shopId, filter, filterKey]);

  const isLoading = data?.key !== filterKey;
  const entries = !isLoading ? data?.entries : null;
  const hasFilter = filterKey !== JSON.stringify(EMPTY_FILTER);

  function handleExport() {
    if (!entries) return;
    exportToCsv(`funds-ledger-${new Date().toISOString().slice(0, 10)}`, entries.items, [
      { header: "Date", formatter: (e) => new Date(e.date).toISOString().slice(0, 10) },
      { header: "Description", key: "label" },
      { header: "Type", formatter: (e) => LINE_LABELS[e.line] },
      { header: "Account", formatter: (e) => ACCOUNT_LABELS[e.account] },
      { header: "In/Out", key: "direction" },
      { header: "Amount (ETB)", formatter: (e) => (e.direction === "IN" ? e.amount : -e.amount) },
      { header: "Notes", formatter: (e) => e.notes || "" },
    ]);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-4">
        <select
          value={filter.line}
          onChange={(e) => onFilterChange({ ...filter, line: e.target.value as FundsLine | "" })}
          className={selectClass}
        >
          <option value="">All types</option>
          {ALL_LINES.map((line) => (
            <option key={line} value={line}>
              {LINE_LABELS[line]}
            </option>
          ))}
        </select>
        <select
          value={filter.account}
          onChange={(e) => onFilterChange({ ...filter, account: e.target.value as FundAccount | "" })}
          className={selectClass}
        >
          <option value="">All accounts</option>
          {(Object.keys(ACCOUNT_LABELS) as FundAccount[]).map((a) => (
            <option key={a} value={a}>
              {ACCOUNT_LABELS[a]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-zinc-500">
          From
          <input
            type="date"
            value={filter.from}
            onChange={(e) => onFilterChange({ ...filter, from: e.target.value })}
            className={selectClass}
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-zinc-500">
          To
          <input
            type="date"
            value={filter.to}
            onChange={(e) => onFilterChange({ ...filter, to: e.target.value })}
            className={selectClass}
          />
        </label>
        {hasFilter && (
          <button
            type="button"
            onClick={() => onFilterChange(EMPTY_FILTER)}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
          >
            <X className="size-3.5" />
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={handleExport}
          disabled={!entries || entries.items.length === 0}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 disabled:opacity-50"
        >
          <Download className="size-3.5 text-zinc-500" />
          Export CSV
        </button>
      </div>

      {entries && (
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/60 px-4 py-2 text-xs">
          <span className="text-zinc-500">
            {entries.count} {entries.count === 1 ? "record" : "records"}
          </span>
          <span className="text-zinc-500">
            {filter.line && OUT_LINES.includes(filter.line) ? "Total out" : "Net"}{" "}
            <span className="font-mono font-bold tabular-nums text-zinc-900">{formatEtb(entries.total)} ETB</span>
          </span>
        </div>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-xs text-zinc-400">Loading…</p>
      ) : data?.error ? (
        <p className="py-12 text-center text-xs text-zinc-500">Couldn&apos;t load the records.</p>
      ) : !entries || entries.items.length === 0 ? (
        <p className="py-12 text-center text-xs text-zinc-500">No records match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-2.5 font-bold">Date</th>
                <th className="px-4 py-2.5 font-bold">Description</th>
                <th className="px-4 py-2.5 font-bold">Type</th>
                <th className="px-4 py-2.5 font-bold">Account</th>
                <th className="px-4 py-2.5 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {entries.items.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-50/60">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-zinc-500">{formatShortDate(e.date)}</td>
                  <td className="px-4 py-2.5 text-zinc-800">
                    {e.label}
                    {e.notes && <span className="ml-1.5 text-zinc-400">· {e.notes}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600">{LINE_LABELS[e.line]}</td>
                  <td className="px-4 py-2.5 text-zinc-600">{ACCOUNT_LABELS[e.account]}</td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono font-semibold tabular-nums ${
                      e.direction === "IN" ? "text-emerald-700" : "text-zinc-900"
                    }`}
                  >
                    {e.direction === "IN" ? "+" : "−"}
                    {formatEtb(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.count > entries.items.length && (
            <p className="border-t border-zinc-100 px-4 py-2.5 text-[11px] text-zinc-500">
              Showing the latest {entries.items.length} of {entries.count}. The total covers all of them; narrow the
              dates to see older records.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Suppliers owed: pay-later restocks and supplier payments           */
/* ------------------------------------------------------------------ */
function SuppliersTab({
  payables,
  payments,
  onPay,
}: {
  payables: SupplierPayables | null;
  payments: SupplierPayment[];
  onPay: (key: string) => void;
}) {
  return (
    <div className="space-y-5">
      {!payables || payables.suppliers.length === 0 ? (
        <section className="rounded-xl border border-zinc-200/80 bg-white p-8 text-center shadow-2xs">
          <p className="text-sm font-semibold text-zinc-900">Nothing owed to suppliers</p>
          <p className="mt-1 text-xs text-zinc-500">
            Pay-later restocks show up here until you pay them off.
          </p>
        </section>
      ) : (
        payables.suppliers.map((s) => (
          <section key={supplierKey(s)} className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-zinc-900">{s.supplierName || "Unnamed supplier"}</h3>
                <p className="text-xs text-zinc-500">
                  {s.purchases.length} unpaid {s.purchases.length === 1 ? "restock" : "restocks"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold tabular-nums text-amber-800">
                  {formatEtb(s.owed)} <span className="text-xs font-semibold text-zinc-500">ETB</span>
                </span>
                <button
                  type="button"
                  onClick={() => onPay(supplierKey(s))}
                  className="rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
                >
                  Pay
                </button>
              </div>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-2 font-bold">Restock</th>
                  <th className="px-4 py-2 font-bold">Date</th>
                  <th className="px-4 py-2 text-right font-bold">Total</th>
                  <th className="px-4 py-2 text-right font-bold">Paid</th>
                  <th className="px-5 py-2 text-right font-bold">Still owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {s.purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-2 text-zinc-800">
                      {p.productName} × {p.quantity}
                    </td>
                    <td className="px-4 py-2 font-mono text-zinc-500">{formatShortDate(p.purchasedAt)}</td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-zinc-600">{formatEtb(p.totalCost)}</td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-zinc-600">{formatEtb(p.amountPaid)}</td>
                    <td className="px-5 py-2 text-right font-mono font-semibold tabular-nums text-zinc-900">
                      {formatEtb(p.remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}

      <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
        <h3 className="border-b border-zinc-100 px-5 py-3.5 text-sm font-bold tracking-tight text-zinc-900">
          Recent supplier payments
        </h3>
        {payments.length === 0 ? (
          <p className="px-5 py-6 text-xs text-zinc-500">No supplier payments yet.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-zinc-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-2.5 font-mono text-zinc-500">{formatShortDate(p.paidAt)}</td>
                  <td className="px-4 py-2.5 text-zinc-800">
                    {p.supplierName || "Supplier"}
                    {p.notes && <span className="ml-1.5 text-zinc-400">· {p.notes}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600">{ACCOUNT_LABELS[p.account]}</td>
                  <td className="px-5 py-2.5 text-right font-mono font-semibold tabular-nums text-zinc-900">
                    −{formatEtb(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
function FundsPageContent() {
  const searchParams = useSearchParams();
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    initialTab === "ledger" || initialTab === "suppliers" ? initialTab : "overview",
  );
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>(EMPTY_FILTER);
  const [funds, setFunds] = useState<FundsSummary | null>(null);
  const [payables, setPayables] = useState<SupplierPayables | null>(null);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [payKey, setPayKey] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(
    () =>
      Promise.all([
        getFundsSummary(shopId),
        getSupplierPayables(shopId).catch(() => null),
        getSupplierPayments(shopId, { limit: 20 }).catch(() => [] as SupplierPayment[]),
      ])
        .then(([f, p, pay]) => {
          setFunds(f);
          setPayables(p);
          setPayments(pay);
          setStatus("ready");
        })
        .catch(() => setStatus("error")),
    [shopId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const reload = () => {
    load();
    setReloadToken((t) => t + 1);
  };

  const owed = funds?.owedToSuppliers ?? 0;
  const tabs = useMemo(
    () =>
      [
        { id: "overview" as const, label: "Overview" },
        { id: "ledger" as const, label: "Ledger" },
        { id: "suppliers" as const, label: owed > 0 ? `Suppliers owed · ${formatEtb(owed)}` : "Suppliers owed" },
      ],
    [owed],
  );

  if (status === "loading") return <LoadingState />;

  if (status === "error" || !funds) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-zinc-600">Couldn&apos;t load Funds right now.</p>
        <button
          type="button"
          onClick={() => {
            setStatus("loading");
            load();
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <RotateCcw className="size-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950">Funds</h1>
          <p className="text-xs text-zinc-500">
            Real money in your till, bank and Telebirr — money in minus money out.
          </p>
        </div>
        {owed > 0 && (
          <button
            type="button"
            onClick={() => setPayKey("")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
          >
            Pay supplier
            <span className="font-mono font-semibold text-slate-300">· {formatEtb(owed)} owed</span>
          </button>
        )}
      </div>

      {/* Money left and where it is */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Money left</span>
            <span className="rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Right now
            </span>
          </div>
          <p
            className={`mt-3 font-mono text-2xl font-bold tracking-tight tabular-nums ${
              funds.moneyLeft < 0 ? "text-rose-300" : "text-white"
            }`}
          >
            {formatEtb(funds.moneyLeft)} <span className="text-xs font-semibold text-slate-400">ETB</span>
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            In {formatEtb(funds.moneyIn)} · Out {formatEtb(funds.moneyOut)}
          </p>
        </div>
        {funds.accounts.map((account) => {
          const Icon = ACCOUNT_ICONS[account.account];
          return (
            <button
              key={account.account}
              type="button"
              onClick={() => {
                setLedgerFilter({ ...EMPTY_FILTER, account: account.account });
                setTab("ledger");
              }}
              className="rounded-xl border border-zinc-200/80 bg-white p-5 text-left shadow-2xs transition-all hover:border-zinc-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{account.label}</span>
                <div className="flex size-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
                  <Icon className="size-4" />
                </div>
              </div>
              <p
                className={`mt-3 font-mono text-2xl font-bold tracking-tight tabular-nums ${
                  account.balance < 0 ? "text-rose-700" : "text-zinc-900"
                }`}
              >
                {formatEtb(account.balance)} <span className="text-xs font-semibold text-zinc-500">ETB</span>
              </p>
              <p className="mt-2 text-[11px] text-zinc-500">See records →</p>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              tab === t.id
                ? "border border-zinc-200/80 bg-white font-semibold text-zinc-900 shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab
          funds={funds}
          onOpenLine={(line) => {
            setLedgerFilter({ ...EMPTY_FILTER, line });
            setTab("ledger");
          }}
        />
      )}
      {tab === "ledger" && (
        <LedgerTab key={reloadToken} shopId={shopId} filter={ledgerFilter} onFilterChange={setLedgerFilter} />
      )}
      {tab === "suppliers" && <SuppliersTab payables={payables} payments={payments} onPay={setPayKey} />}

      {payKey !== null && (
        <PaySupplierModal
          shopId={shopId}
          initialSupplierKey={payKey || undefined}
          onClose={() => setPayKey(null)}
          onPaid={reload}
        />
      )}
    </div>
  );
}

export default function FundsPage() {
  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"]}>
      <Suspense fallback={<LoadingState />}>
        <FundsPageContent />
      </Suspense>
    </RouteGuard>
  );
}
