"use client";

import { ArrowLeftRight, Plus, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { AddMoneyModal } from "@/components/funds/add-money-modal";
import { ActivityPanel, EMPTY_FILTER, type LedgerFilter } from "@/components/funds/activity-list";
import { BalanceOverview } from "@/components/funds/balance-overview";
import { BreakdownPanel } from "@/components/funds/breakdown-panel";
import { PeriodBar } from "@/components/funds/period-bar";
import { usePeriodLines, useFundsEntries } from "@/components/funds/use-funds-entries";
import { TransferModal } from "@/components/funds/transfer-modal";
import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
import { getFundsSummary } from "@/lib/api/app-data";
import type { FundsSummary } from "@/lib/api/types";
import { useT } from "@/lib/i18n/use-t";
import type { Direction } from "@/lib/utils/funds-activity";
import { emptyLineTotals, periodRange } from "@/lib/utils/funds-period";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
function FundsPageContent() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  // What is owed to suppliers now lives on the Suppliers page; old links are sent there.
  const initialTab = searchParams.get("tab");
  useEffect(() => {
    if (initialTab === "suppliers") router.replace("/suppliers?filter=owed");
  }, [initialTab, router]);

  // The page opens on the last 7 days.
  const [filter, setFilter] = useState<LedgerFilter>(() => ({ ...EMPTY_FILTER, ...periodRange("WEEK") }));
  const [direction, setDirection] = useState<Direction>("ALL");
  const [customMode, setCustomMode] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [funds, setFunds] = useState<FundsSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isMoving, setIsMoving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(
    () =>
      getFundsSummary(shopId)
        .then((f) => {
          setFunds(f);
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

  // The records for the chosen period, and the money per type for it (exact, even beyond 500 records)
  const { entries, isLoading: entriesLoading, hasError } = useFundsEntries(shopId, filter, reloadToken);
  const period = usePeriodLines(shopId, filter, entries, funds?.lines ?? emptyLineTotals());

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
          onClick={() => setIsAdding(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50"
        >
          <Plus className="size-3.5 text-zinc-500" />
          {t("fundsPage.addMoney")}
        </button>
        <button
          type="button"
          onClick={() => setIsMoving(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50"
        >
          <ArrowLeftRight className="size-3.5 text-zinc-500" />
          {t("fundsPage.moveMoney")}
        </button>
        </div>
      </div>

      {/* Money now and each account */}
      <BalanceOverview
        funds={funds}
        onOpenAccount={(account) => setFilter((f) => ({ ...f, account }))}
      />

      {/* How did it go? Money in, out and net for the chosen period */}
      <PeriodBar
        filter={filter}
        onFilterChange={setFilter}
        lines={period.lines}
        isLoading={period.isLoading}
        direction={direction}
        onDirectionChange={setDirection}
        breakdownOpen={showBreakdown}
        onToggleBreakdown={() => setShowBreakdown((v) => !v)}
        customMode={customMode}
        onCustomMode={setCustomMode}
      />
      {showBreakdown && period.lines && (
        <BreakdownPanel
          lines={period.lines}
          onOpenLine={(line) => {
            setFilter((f) => ({ ...f, line }));
            setDirection("ALL");
            setShowBreakdown(false);
          }}
        />
      )}

      {/* Every record of the period */}
      <ActivityPanel
        entries={entries}
        isLoading={entriesLoading}
        hasError={hasError}
        filter={filter}
        onFilterChange={setFilter}
        direction={direction}
        onDirectionChange={setDirection}
      />

      {isAdding && funds && (
        <AddMoneyModal shopId={shopId} funds={funds} onClose={() => setIsAdding(false)} onAdded={reload} />
      )}

      {isMoving && funds && (
        <TransferModal shopId={shopId} funds={funds} onClose={() => setIsMoving(false)} onMoved={reload} />
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
