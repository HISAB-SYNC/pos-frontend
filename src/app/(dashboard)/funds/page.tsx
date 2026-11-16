"use client";

import { ArrowLeftRight, RotateCcw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { formatEtb } from "@/components/funds/funds-shared";
import { ActivityList, EMPTY_FILTER, type LedgerFilter } from "@/components/funds/activity-list";
import { BalanceOverview } from "@/components/funds/balance-overview";
import { PaySupplierModal } from "@/components/funds/pay-supplier-modal";
import { SuppliersOwed } from "@/components/funds/suppliers-owed";
import { SummaryPanel } from "@/components/funds/summary-panel";
import { TransferModal } from "@/components/funds/transfer-modal";
import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
import { getFundsSummary, getSupplierPayables, getSupplierPayments } from "@/lib/api/app-data";
import type { FundsSummary, SupplierPayables, SupplierPayment } from "@/lib/api/types";
import { useT } from "@/lib/i18n/use-t";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";

type Tab = "activity" | "summary" | "suppliers";

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
        <SummaryPanel
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
      {tab === "suppliers" && <SuppliersOwed payables={payables} payments={payments} onPay={setPayKey} />}

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
