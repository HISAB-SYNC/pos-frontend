"use client";

import { ChevronDown, Store } from "lucide-react";
import { useState } from "react";

import type { SupplierPayables, SupplierPayment } from "@/lib/api/types";
import { useFormat } from "@/lib/i18n/use-format";
import { useT } from "@/lib/i18n/use-t";

import { EntryIcon } from "./entry-icon";
import { ACCOUNT_LABELS, formatEtb } from "./funds-shared";
import { supplierKey } from "./pay-supplier-modal";

/** Suppliers the shop owes money to, with their unpaid restocks, and the latest payments. */
export function SuppliersOwed({
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
  const suppliers = payables?.suppliers ?? [];
  // With a single supplier its restocks are shown right away; otherwise they start folded.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (key: string) => open[key] ?? suppliers.length === 1;

  return (
    <div className="space-y-5">
      {suppliers.length === 0 ? (
        <section className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-6 py-12 text-center shadow-2xs">
          <span className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Store className="size-5" />
          </span>
          <p className="text-sm font-semibold text-zinc-900">{t("fundsPage.suppliers.nothingOwed")}</p>
          <p className="max-w-xs text-xs text-zinc-500">{t("fundsPage.suppliers.nothingOwedHint")}</p>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold tracking-tight text-zinc-900">{t("fundsPage.suppliers.title")}</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 font-mono text-xs font-bold tabular-nums text-amber-900">
              {t("fundsPage.suppliers.owedTotal", { amount: formatEtb(payables?.totalOwed ?? 0) })}
            </span>
          </div>

          {suppliers.map((s) => {
            const key = supplierKey(s);
            const expanded = isOpen(key);
            const oldest = s.purchases.reduce<string | null>(
              (min, p) => (min === null || new Date(p.purchasedAt) < new Date(min) ? p.purchasedAt : min),
              null,
            );
            return (
              <section key={key} className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200/70">
                    <Store className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold tracking-tight text-zinc-900">
                      {s.supplierName || t("fundsPage.suppliers.unnamed")}
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      {t.n("fundsPage.suppliers.unpaidRestocks", s.purchases.length)}
                      {oldest ? ` · ${t("fundsPage.suppliers.oldest", { date: formatDate(oldest) })}` : ""}
                    </p>
                  </div>
                  <span className="font-mono text-lg font-bold tabular-nums text-amber-800">
                    {formatEtb(s.owed)} <span className="text-xs font-semibold text-zinc-500">{t("shared.etb")}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onPay(key)}
                    className="rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95"
                  >
                    {t("fundsPage.suppliers.pay")}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen((prev) => ({ ...prev, [key]: !expanded }))}
                  className="flex w-full items-center justify-center gap-1 border-t border-zinc-100 bg-zinc-50/60 py-1.5 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  {t(expanded ? "fundsPage.suppliers.hideRestocks" : "fundsPage.suppliers.showRestocks")}
                  <ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>

                {expanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-xs">
                      <thead>
                        <tr className="border-t border-zinc-100 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
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
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}

      <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
        <h3 className="border-b border-zinc-100 px-4 py-3 text-sm font-bold tracking-tight text-zinc-900 sm:px-5">
          {t("fundsPage.suppliers.recentPayments")}
        </h3>
        {payments.length === 0 ? (
          <p className="px-5 py-6 text-xs text-zinc-500">{t("fundsPage.suppliers.noPayments")}</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <EntryIcon kind="out" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {p.supplierName || t("fundsPage.suppliers.fallbackName")}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {t(ACCOUNT_LABELS[p.account])} · {formatDate(p.paidAt)}
                    {p.notes && <span className="text-zinc-400"> · {p.notes}</span>}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-bold tabular-nums text-rose-700">−{formatEtb(p.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
