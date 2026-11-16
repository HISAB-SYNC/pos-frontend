"use client";

import { Trash2, X } from "lucide-react";
import { useState } from "react";

import { createSupplier, deleteSupplier, updateSupplier } from "@/lib/api";
import type { Supplier } from "@/lib/api/types";
import { useT } from "@/lib/i18n/use-t";

const inputClass =
  "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:ring-1 focus:ring-[#5B4FE9] focus:outline-hidden";

function errorText(err: unknown, fallback: string) {
  const message = (err as { message?: string } | null)?.message;
  return message && message.trim() ? message : fallback;
}

/* ------------------------------------------------------------------ */
/* Add supplier                                                       */
/* ------------------------------------------------------------------ */
/**
 * Only what the server stores is asked for: the name and one contact text
 * (phone or email).
 */
export function AddSupplierModal({
  initialName = "",
  onClose,
  onCreated,
  shopId,
}: {
  /** Pre-fills the name, e.g. for a supplier that was only typed in on a restock */
  initialName?: string;
  onClose: () => void;
  onCreated: (supplier: Supplier) => void;
  shopId: string;
}) {
  const t = useT();
  const [name, setName] = useState(initialName);
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createSupplier(shopId, { name: name.trim(), contactInfo: contact.trim() });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(errorText(err, t("suppliers.saveError")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[460px] rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">{t("suppliers.addTitle")}</h2>
            <p className="text-xs text-zinc-500">{t("suppliers.addSubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("shared.close")}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-zinc-700">{t("suppliers.nameRequired")}</label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("suppliers.namePlaceholder")}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-zinc-700">{t("suppliers.contactLabel")}</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("suppliers.contactPlaceholder")}
              className={inputClass}
            />
          </div>

          {error && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">{error}</p>}

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              {t("suppliers.discard")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-md bg-slate-900 px-4 py-2 font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? t("suppliers.adding") : t("suppliers.addSupplier")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Edit supplier                                                      */
/* ------------------------------------------------------------------ */
export function EditSupplierModal({
  supplier,
  onClose,
  onUpdated,
  shopId,
}: {
  supplier: Supplier;
  onClose: () => void;
  onUpdated: () => void;
  shopId: string;
}) {
  const t = useT();
  const [name, setName] = useState(supplier.name || "");
  const [contact, setContact] = useState(supplier.contactInfo || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateSupplier(shopId, supplier.id, { name: name.trim(), contactInfo: contact.trim() });
      onUpdated();
      onClose();
    } catch (err) {
      setError(errorText(err, t("suppliers.saveError")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[460px] rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">{t("suppliers.editTitle")}</h2>
            <p className="text-xs text-zinc-500">{t("suppliers.editSubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("shared.close")}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-zinc-700">{t("suppliers.nameRequired")}</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-zinc-700">{t("suppliers.contactLabel")}</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("suppliers.contactPlaceholder")}
              className={inputClass}
            />
          </div>

          {error && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">{error}</p>}

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              {t("suppliers.discard")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-md bg-slate-900 px-4 py-2 font-bold text-white shadow-2xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? t("shared.saving") : t("suppliers.saveChanges")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Delete supplier                                                    */
/* ------------------------------------------------------------------ */
export function DeleteSupplierDialog({
  supplier,
  onClose,
  onDeleted,
  shopId,
}: {
  supplier: Supplier;
  onClose: () => void;
  onDeleted: () => void;
  shopId: string;
}) {
  const t = useT();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteSupplier(shopId, supplier.id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(errorText(err, t("suppliers.deleteError")));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:p-6">
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-rose-500/15">
          <Trash2 className="size-5" />
        </div>
        <h3 className="text-base font-bold tracking-tight text-zinc-900">{t("suppliers.deleteTitle")}</h3>
        <p className="mt-1 text-xs text-zinc-500">{t("suppliers.deleteConfirm", { name: supplier.name })}</p>
        {error && <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">{error}</p>}

        <div className="mt-5 flex justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200 px-4 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            {t("shared.cancel")}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-md bg-rose-600 px-4 py-2 font-bold text-white shadow-2xs transition-all hover:bg-rose-700 active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? t("suppliers.deleting") : t("suppliers.deletePermanently")}
          </button>
        </div>
      </div>
    </div>
  );
}
