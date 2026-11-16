"use client";

import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { EntryIcon } from "@/components/funds/entry-icon";
import { ACCOUNT_LABELS, formatEtb } from "@/components/funds/funds-shared";
import { PaySupplierModal, supplierKey } from "@/components/funds/pay-supplier-modal";
import { LoadingState } from "@/components/shared/loading-state";
import { RouteGuard } from "@/components/shared/route-guard";
import { TablePagination, usePagination } from "@/components/shared/table-pagination";
import { AddSupplierModal, DeleteSupplierDialog, EditSupplierModal } from "@/components/suppliers/supplier-modals";
import { getSuppliers } from "@/lib/api";
import { getSupplierPayables, getSupplierPayments } from "@/lib/api/app-data";
import type { Supplier, SupplierPayable, SupplierPayment } from "@/lib/api/types";
import { useFormat } from "@/lib/i18n/use-format";
import { useT } from "@/lib/i18n/use-t";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";

/**
 * One supplier on its own page: contact, how much is owed (with the unpaid
 * restocks) and the payments. `/suppliers/unlisted?name=…` shows debts for a
 * supplier that was only typed in by name and is not in the supplier list.
 */
function SupplierPageContent() {
  const t = useT();
  const { formatDate } = useFormat();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const shopId = useShopStore((state) => state.activeShopId) ?? MOCK_IDS.shop;

  const isUnlisted = id === "unlisted";
  const unlistedName = searchParams.get("name") ?? "";

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [payable, setPayable] = useState<SupplierPayable | null>(null);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const key = isUnlisted ? supplierKey({ supplierId: null, supplierName: unlistedName }) : `id:${id}`;

  const load = useCallback(async () => {
    try {
      const [suppliers, owed, paid] = await Promise.all([
        getSuppliers(shopId),
        getSupplierPayables(shopId).catch(() => null),
        getSupplierPayments(
          shopId,
          isUnlisted ? { supplierName: unlistedName, limit: 100 } : { supplierId: id, limit: 100 },
        ).catch(() => [] as SupplierPayment[]),
      ]);
      setSupplier(isUnlisted ? null : ((suppliers ?? []).find((s) => s.id === id) ?? null));
      setPayable(owed?.suppliers.find((p) => supplierKey(p) === key) ?? null);
      setPayments(paid);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, id, isUnlisted, unlistedName, key]);

  useEffect(() => {
    load();
  }, [load]);

  const paymentsPager = usePagination(payments, 10);

  const name = supplier?.name ?? unlistedName;
  const owed = payable?.owed ?? 0;
  const found = !!supplier || (isUnlisted && !!unlistedName && (!!payable || payments.length > 0));

  const back = (
    <Link href="/suppliers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-950">
      <ArrowLeft className="size-3.5" />
      {t("suppliers.backToList")}
    </Link>
  );

  if (isLoading) return <LoadingState />;

  if (!found) {
    return (
      <div className="space-y-5">
        {back}
        <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-6 py-14 text-center shadow-2xs">
          <p className="text-sm font-semibold text-zinc-900">{t("suppliers.notFoundTitle")}</p>
          <p className="max-w-sm text-xs text-zinc-500">{t("suppliers.notFoundHint")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPay && <PaySupplierModal shopId={shopId} initialSupplierKey={key} onClose={() => setShowPay(false)} onPaid={load} />}
      {showEdit && supplier && (
        <EditSupplierModal supplier={supplier} onClose={() => setShowEdit(false)} onUpdated={load} shopId={shopId} />
      )}
      {showDelete && supplier && (
        <DeleteSupplierDialog
          supplier={supplier}
          onClose={() => setShowDelete(false)}
          onDeleted={() => router.push("/suppliers")}
          shopId={shopId}
        />
      )}
      {showAdd && (
        <AddSupplierModal
          initialName={unlistedName}
          onClose={() => setShowAdd(false)}
          onCreated={(created) => router.replace(`/suppliers/${created.id}`)}
          shopId={shopId}
        />
      )}

      <div className="space-y-5">
        {back}

        {/* Name and contact */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-2xs sm:p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-mono text-base font-bold text-zinc-700 ring-1 ring-zinc-200">
            {name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight text-zinc-900">{name}</h1>
            {supplier ? (
              <p className="font-mono text-xs text-zinc-500">{supplier.contactInfo || t("suppliers.detail.noContact")}</p>
            ) : (
              <p className="text-xs font-medium text-amber-800">{t("suppliers.detail.notListed")}</p>
            )}
          </div>
          {supplier ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50"
              >
                <Edit2 className="size-3.5 text-zinc-500" />
                {t("shared.edit")}
              </button>
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-rose-700 shadow-2xs hover:border-rose-300 hover:bg-rose-50"
              >
                <Trash2 className="size-3.5" />
                {t("shared.delete")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex h-9 items-center rounded-md bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs hover:bg-slate-800"
            >
              {t("suppliers.addToList")}
            </button>
          )}
        </div>

        {/* What you owe */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 shadow-2xs sm:p-5 ${
            owed > 0 ? "border-amber-200 bg-amber-50/70" : "border-emerald-200 bg-emerald-50/50"
          }`}
        >
          {owed > 0 ? (
            <>
              <div>
                <p className="text-xs font-semibold text-amber-900">{t("suppliers.detail.youOwe")}</p>
                <p className="font-mono text-3xl font-bold tabular-nums text-amber-900">
                  {formatEtb(owed)} <span className="text-sm font-semibold text-amber-800/70">{t("shared.etb")}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPay(true)}
                className="rounded-md bg-amber-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-950"
              >
                {t("suppliers.pay")}
              </button>
            </>
          ) : (
            <p className="text-sm font-semibold text-emerald-900">{t("suppliers.detail.settled")}</p>
          )}
        </div>

        {/* Unpaid restocks */}
        {payable && payable.purchases.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
            <h2 className="border-b border-zinc-100 px-4 py-3 text-sm font-bold tracking-tight text-zinc-900 sm:px-5">
              {t("suppliers.detail.unpaidRestocks")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead>
                  <tr className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="px-5 py-2 font-bold">{t("suppliers.detail.colRestock")}</th>
                    <th className="px-4 py-2 font-bold">{t("shared.date")}</th>
                    <th className="px-4 py-2 text-right font-bold">{t("shared.total")}</th>
                    <th className="px-4 py-2 text-right font-bold">{t("shared.paid")}</th>
                    <th className="px-5 py-2 text-right font-bold">{t("suppliers.detail.colRemaining")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {payable.purchases.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-2.5 text-zinc-800">
                        {p.productName} × {p.quantity}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-zinc-500">{formatDate(p.purchasedAt)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-600">{formatEtb(p.totalCost)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-600">{formatEtb(p.amountPaid)}</td>
                      <td className="px-5 py-2.5 text-right font-mono font-bold tabular-nums text-amber-800">
                        {formatEtb(p.remaining)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Payments */}
        <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
          <h2 className="border-b border-zinc-100 px-4 py-3 text-sm font-bold tracking-tight text-zinc-900 sm:px-5">
            {t("suppliers.detail.payments")}
          </h2>
          {payments.length === 0 ? (
            <p className="px-5 py-6 text-xs text-zinc-500">{t("suppliers.detail.noPayments")}</p>
          ) : (
            <>
              <ul className="divide-y divide-zinc-100">
                {paymentsPager.pageItems.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <EntryIcon kind="out" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900">{formatDate(p.paidAt)}</p>
                      <p className="truncate text-[11px] text-zinc-500">
                        {t(ACCOUNT_LABELS[p.account])}
                        {p.notes && <span className="text-zinc-400"> · {p.notes}</span>}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-rose-700">−{formatEtb(p.amount)}</span>
                  </li>
                ))}
              </ul>
              <TablePagination pagination={paymentsPager} noun={t("suppliers.detail.payments")} />
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default function SupplierPage() {
  return (
    <RouteGuard requiredRole={["OWNER", "ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"]}>
      <Suspense fallback={<LoadingState />}>
        <SupplierPageContent />
      </Suspense>
    </RouteGuard>
  );
}
