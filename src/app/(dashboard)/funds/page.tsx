"use client";

import { ArrowLeftRight, Info, RotateCcw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import {
  ACCOUNT_LABELS,
  IN_LINES,
  LINE_HINTS,
  LINE_LABELS,
  OUT_LINES,
  formatEtb,
} from "@/components/funds/funds-shared";
import { ActivityList, EMPTY_FILTER, type LedgerFilter } from "@/components/funds/activity-list";
import { BalanceOverview } from "@/components/funds/balance-overview";
import { PaySupplierModal, supplierKey } from "@/components/funds/pay-supplier-modal";
import { TransferModal } from "@/components/funds/transfer-modal";
import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
import { getFundsSummary, getSupplierPayables, getSupplierPayments } from "@/lib/api/app-data";
import type {
  FundsLine,
  FundsSummary,
  SupplierPayables,
  SupplierPayment,
} from "@/lib/api/types";
import { useFormat } from "@/lib/i18n/use-format";
import { useT } from "@/lib/i18n/use-t";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";

type Tab = "activity" | "summary" | "suppliers";

/* ------------------------------------------------------------------ */
/* Overview: money in / out lines and the split per account           */
/* ------------------------------------------------------------------ */
function OverviewTab({ funds, onOpenLine }: { funds: FundsSummary; onOpenLine: (line: FundsLine) => void }) {
  const t = useT();
  const { formatDate } = useFormat();
  const renderLine = (line: FundsLine, sign: "+" | "−") => (
    <button
      key={line}
      type="button"
      onClick={() => onOpenLine(line)}
      className="group flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-zinc-50"
    >
      <span className="flex items-center gap-1.5 text-xs text-zinc-700">
        {t(LINE_LABELS[line])}
        <span title={LINE_HINTS[line] ? t(LINE_HINTS[line]) : undefined} className="text-zinc-300">
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
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">{t("fundsPage.overview.moneyInOut")}</h2>
        <p className="mb-3 text-xs text-zinc-500">
          {funds.since
            ? t("fundsPage.overview.sinceTap", { date: formatDate(funds.since) })
            : t("fundsPage.overview.tap")}
        </p>
        <p className="px-2 pb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">{t("fundsPage.overview.in")}</p>
        {IN_LINES.map((line) => renderLine(line, "+"))}
        <p className="mt-2 px-2 pb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">{t("fundsPage.overview.out")}</p>
        {OUT_LINES.map((line) => renderLine(line, "−"))}
        <div className="mt-2 flex items-center justify-between border-t border-zinc-900 px-2 pt-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">{t("fundsPage.moneyLeft")}</span>
          <span
            className={`font-mono text-xl font-bold tracking-tight tabular-nums ${
              funds.moneyLeft < 0 ? "text-rose-700" : "text-zinc-900"
            }`}
          >
            {formatEtb(funds.moneyLeft)} <span className="text-xs font-semibold text-zinc-500">{t("shared.etb")}</span>
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs lg:col-span-2">
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">{t("fundsPage.overview.byAccount")}</h2>
        <p className="mb-3 text-xs text-zinc-500">{t("fundsPage.overview.bankNote")}</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              <th className="pb-2 font-bold">{t("fundsPage.overview.account")}</th>
              <th className="pb-2 text-right font-bold">{t("fundsPage.overview.in")}</th>
              <th className="pb-2 text-right font-bold">{t("fundsPage.overview.out")}</th>
              <th className="pb-2 text-right font-bold">{t("fundsPage.overview.left")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {funds.accounts.map((a) => (
              <tr key={a.account}>
                <td className="py-2 text-zinc-700">{t(ACCOUNT_LABELS[a.account])}</td>
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
          <span className="font-semibold text-zinc-800">{t("fundsPage.overview.fundsVsProfit")}</span>{" "}
          {t("fundsPage.overview.fundsVsProfitBody")}
        </p>
      </section>
    </div>
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
  const t = useT();
  const { formatDate } = useFormat();
  return (
    <div className="space-y-5">
      {!payables || payables.suppliers.length === 0 ? (
        <section className="rounded-xl border border-zinc-200/80 bg-white p-8 text-center shadow-2xs">
          <p className="text-sm font-semibold text-zinc-900">{t("fundsPage.suppliers.nothingOwed")}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {t("fundsPage.suppliers.nothingOwedHint")}
          </p>
        </section>
      ) : (
        payables.suppliers.map((s) => (
          <section key={supplierKey(s)} className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-zinc-900">{s.supplierName || t("fundsPage.suppliers.unnamed")}</h3>
                <p className="text-xs text-zinc-500">
                  {t.n("fundsPage.suppliers.unpaidRestocks", s.purchases.length)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold tabular-nums text-amber-800">
                  {formatEtb(s.owed)} <span className="text-xs font-semibold text-zinc-500">{t("shared.etb")}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onPay(supplierKey(s))}
                  className="rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
                >
                  {t("fundsPage.suppliers.pay")}
                </button>
              </div>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50/60 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-2 font-bold">{t("fundsPage.suppliers.restock")}</th>
                  <th className="px-4 py-2 font-bold">{t("shared.date")}</th>
                  <th className="px-4 py-2 text-right font-bold">{t("shared.total")}</th>
                  <th className="px-4 py-2 text-right font-bold">{t("shared.paid")}</th>
                  <th className="px-5 py-2 text-right font-bold">{t("fundsPage.suppliers.stillOwed")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {s.purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-2 text-zinc-800">
                      {p.productName} × {p.quantity}
                    </td>
                    <td className="px-4 py-2 font-mono text-zinc-500">{formatDate(p.purchasedAt)}</td>
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
          {t("fundsPage.suppliers.recentPayments")}
        </h3>
        {payments.length === 0 ? (
          <p className="px-5 py-6 text-xs text-zinc-500">{t("fundsPage.suppliers.noPayments")}</p>
        ) : (
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-zinc-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-2.5 font-mono text-zinc-500">{formatDate(p.paidAt)}</td>
                  <td className="px-4 py-2.5 text-zinc-800">
                    {p.supplierName || t("fundsPage.suppliers.fallbackName")}
                    {p.notes && <span className="ml-1.5 text-zinc-400">· {p.notes}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600">{t(ACCOUNT_LABELS[p.account])}</td>
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
  const t = useT();
  const searchParams = useSearchParams();
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  // Older links use ?tab=ledger / overview; they keep working.
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    initialTab === "suppliers"
      ? "suppliers"
      : initialTab === "summary" || initialTab === "overview"
        ? "summary"
        : "activity",
  );
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>(EMPTY_FILTER);
  const [funds, setFunds] = useState<FundsSummary | null>(null);
  const [payables, setPayables] = useState<SupplierPayables | null>(null);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [payKey, setPayKey] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
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
    setReloadToken((n) => n + 1);
  };

  const owed = funds?.owedToSuppliers ?? 0;
  const tabs = useMemo(
    () =>
      [
        { id: "activity" as const, label: t("fundsPage.tab.activity"), badge: null as string | null },
        { id: "summary" as const, label: t("fundsPage.tab.summary"), badge: null as string | null },
        {
          id: "suppliers" as const,
          label: t("fundsPage.tab.suppliersShort"),
          badge: owed > 0 ? formatEtb(owed) : null,
        },
      ],
    [owed, t],
  );

  if (status === "loading") return <LoadingState />;

  if (status === "error" || !funds) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-zinc-600">{t("fundsPage.loadError")}</p>
        <button
          type="button"
          onClick={() => {
            setStatus("loading");
            load();
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <RotateCcw className="size-3.5" />
          {t("shared.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-950">{t("fundsPage.title")}</h1>
          <p className="text-xs text-zinc-500">
            {t("fundsPage.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsMoving(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50"
        >
          <ArrowLeftRight className="size-3.5 text-zinc-500" />
          {t("fundsPage.moveMoney")}
        </button>
        {owed > 0 && (
          <button
            type="button"
            onClick={() => setPayKey("")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
          >
            {t("fundsPage.paySupplier")}
            <span className="font-mono font-semibold text-slate-300">{t("fundsPage.owedSuffix", { amount: formatEtb(owed) })}</span>
          </button>
        )}
        </div>
      </div>

      {/* Money now, each account, and a reminder when suppliers are owed */}
      <BalanceOverview
        funds={funds}
        onOpenAccount={(account) => {
          setLedgerFilter({ ...EMPTY_FILTER, account });
          setTab("activity");
        }}
        onSeeSuppliers={() => setTab("suppliers")}
      />

      {/* Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200/80 bg-zinc-100/70 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              tab === item.id
                ? "border border-zinc-200/80 bg-white font-semibold text-zinc-900 shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
            }`}
          >
            {item.label}
            {item.badge && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums text-amber-800">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <OverviewTab
          funds={funds}
          onOpenLine={(line) => {
            setLedgerFilter({ ...EMPTY_FILTER, line });
            setTab("activity");
          }}
        />
      )}
      {tab === "activity" && (
        <ActivityList key={reloadToken} shopId={shopId} filter={ledgerFilter} onFilterChange={setLedgerFilter} />
      )}
      {tab === "suppliers" && <SuppliersTab payables={payables} payments={payments} onPay={setPayKey} />}

      {isMoving && funds && (
        <TransferModal shopId={shopId} funds={funds} onClose={() => setIsMoving(false)} onMoved={reload} />
      )}

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
