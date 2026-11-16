"use client";

import { Edit2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { EntryIcon } from "@/components/funds/entry-icon";
import { ACCOUNT_LABELS, formatEtb } from "@/components/funds/funds-shared";
import { getSupplierPayments } from "@/lib/api/app-data";
import type { Supplier, SupplierPayable, SupplierPayment } from "@/lib/api/types";
import { useFormat } from "@/lib/i18n/use-format";
import { useT } from "@/lib/i18n/use-t";

export type SupplierDetailTarget = {
  /** `supplierKey()` of the supplier: `id:<id>` or `name:<lowercase name>` */
  key: string;
  /** The supplier record, or null when it was only typed in by name on a restock */
  supplier: Supplier | null;
  name: string;
};

/**
 * Everything about one supplier in one place: contact details, how much is
 * still owed (with the unpaid restocks), a Pay button and the latest payments.
 */
export function SupplierDetailPanel({
  shopId,
  target,
  payable,
  onClose,
  onPay,
  onEdit,
  onDelete,
  onAddToList,
}: {
  shopId: string;
  target: SupplierDetailTarget;
  payable: SupplierPayable | null;
  onClose: () => void;
  onPay: (key: string) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onAddToList: (name: string) => void;
}) {
  const t = useT();
  const { formatDate } = useFormat();
  const { supplier } = target;
  const [payments, setPayments] = useState<SupplierPayment[] | null>(null);

  // Reload the payments after something changed (a payment was made, payables reloaded).
  useEffect(() => {
    let mounted = true;
    getSupplierPayments(shopId, {
      supplierId: supplier?.id ?? null,
      supplierName: supplier ? null : target.name,
      limit: 15,
    })
      .then((rows) => {
        if (mounted) setPayments(rows);
      })
      .catch(() => {
        if (mounted) setPayments([]);
      });
    return () => {
      mounted = false;
    };
  }, [shopId, supplier, target.name, payable]);

  const owed = payable?.owed ?? 0;
  const isTaking = supplier?.type === "Taking Return" || supplier?.type === undefined;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl animate-in slide-in-from-right duration-200 sm:w-[460px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-zinc-100 px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-mono text-sm font-bold text-zinc-700 ring-1 ring-zinc-200">
            {target.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold tracking-tight text-zinc-900">{target.name}</h2>
            {supplier?.product ? (
              <p className="truncate text-xs text-zinc-500">{supplier.product}</p>
            ) : !supplier ? (
              <p className="text-xs text-amber-800">{t("suppliers.detail.notListed")}</p>
            ) : null}
          </div>
          {supplier && (
            <>
              <button
                type="button"
                onClick={() => onEdit(supplier)}
                title={t("suppliers.editTooltip")}
                className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:text-zinc-900"
              >
                <Edit2 className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(supplier)}
                title={t("suppliers.deleteTooltip")}
                className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("shared.close")}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* What you owe */}
          <div
            className={`rounded-xl border p-4 ${owed > 0 ? "border-amber-200 bg-amber-50/70" : "border-emerald-200 bg-emerald-50/50"}`}
          >
            {owed > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-amber-900">{t("suppliers.detail.youOwe")}</p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-amber-900">
                    {formatEtb(owed)} <span className="text-xs font-semibold text-amber-800/70">{t("shared.etb")}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onPay(target.key)}
                  className="rounded-md bg-amber-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-950"
                >
                  {t("suppliers.pay")}
                </button>
              </div>
            ) : (
              <p className="text-sm font-semibold text-emerald-900">{t("suppliers.detail.settled")}</p>
            )}
          </div>

          {/* Contact and policy */}
          {supplier ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">{t("suppliers.detail.contact")}</h3>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">{t("suppliers.contactNumber")}</dt>
                  <dd className="font-mono text-zinc-800">{supplier.contactInfo || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">{t("shared.email")}</dt>
                  <dd className="font-mono text-zinc-800">{supplier.email || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">{t("suppliers.returnPolicy")}</dt>
                  <dd>
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                        isTaking
                          ? "border-emerald-200/80 bg-emerald-50 text-emerald-700"
                          : "border-zinc-200/80 bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {isTaking ? t("suppliers.policyTaking") : t("suppliers.policyNot")}
                    </span>
                  </dd>
                </div>
                {supplier.onTheWay !== undefined && supplier.onTheWay !== "-" && supplier.onTheWay !== "" && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500">{t("suppliers.incomingSupply")}</dt>
                    <dd className="font-mono text-zinc-800">{supplier.onTheWay}</dd>
                  </div>
                )}
              </dl>
            </section>
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
              <p>{t("suppliers.unlistedHint")}</p>
              <button
                type="button"
                onClick={() => onAddToList(target.name)}
                className="mt-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50"
              >
                {t("suppliers.addToList")}
              </button>
            </div>
          )}

          {/* Unpaid restocks */}
          {payable && payable.purchases.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                {t("suppliers.detail.unpaidRestocks")}
              </h3>
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200/80">
                {payable.purchases.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-900">
                        {p.productName} × {p.quantity}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {formatDate(p.purchasedAt)}
                        {p.amountPaid > 0 &&
                          ` · ${t("suppliers.detail.partPaid", { paid: formatEtb(p.amountPaid), total: formatEtb(p.totalCost) })}`}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-amber-800">{formatEtb(p.remaining)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Payments */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">{t("suppliers.detail.payments")}</h3>
            {payments === null ? (
              <p className="text-xs text-zinc-400">{t("shared.loading")}</p>
            ) : payments.length === 0 ? (
              <p className="text-xs text-zinc-500">{t("suppliers.detail.noPayments")}</p>
            ) : (
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200/80">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                    <EntryIcon kind="out" className="size-8" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-900">{formatDate(p.paidAt)}</p>
                      <p className="truncate text-[11px] text-zinc-500">
                        {t(ACCOUNT_LABELS[p.account])}
                        {p.notes && <span className="text-zinc-400"> · {p.notes}</span>}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-rose-700">−{formatEtb(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}

