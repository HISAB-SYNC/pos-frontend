"use client";

import { FolderPlus, Tag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createCategory, deleteCategory, updateCategory } from "@/lib/api";
import type { Category } from "@/lib/api/types";

/* ------------------------------------------------------------------ */
/* Modal: Create Category                                              */
/* ------------------------------------------------------------------ */
export function CreateCategoryModal({
  open,
  onClose,
  onCreated,
  shopId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  shopId: string;
}) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setErrorMsg("");
    try {
      setIsSubmitting(true);
      await createCategory(shopId, name.trim());
      setName("");
      onCreated();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to create category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-[#5B4FE9]">
              <FolderPlus className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Add New Category</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beverages, Bakery, Electronics"
              className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-900 shadow-xs focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-3.5 py-2 font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? "Creating..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Edit Category                                                */
/* ------------------------------------------------------------------ */
export function EditCategoryModal({
  category,
  onClose,
  onUpdated,
  shopId,
}: {
  category: Category | null;
  onClose: () => void;
  onUpdated: () => void;
  shopId: string;
}) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  if (!category) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !name.trim()) return;
    setErrorMsg("");
    try {
      setIsSubmitting(true);
      await updateCategory(shopId, category.id, name.trim());
      onUpdated();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to rename category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <Tag className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Rename Category</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700">Category Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-900 shadow-xs focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-3.5 py-2 font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-slate-800 px-4 py-2 font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog: Delete Category Confirmation                               */
/* ------------------------------------------------------------------ */
export function DeleteCategoryDialog({
  category,
  onClose,
  onDeleted,
  shopId,
}: {
  category: Category | null;
  onClose: () => void;
  onDeleted: () => void;
  shopId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!category) return null;

  async function handleConfirm() {
    if (!category) return;
    setErrorMsg("");
    try {
      setIsDeleting(true);
      await deleteCategory(shopId, category.id);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg("Failed to delete category. Ensure no products are strictly bound to it.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Trash2 className="size-5" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900">Delete Category</h3>
        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
          Are you sure you want to delete category <span className="font-semibold text-zinc-900">&quot;{category.name}&quot;</span>?
        </p>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-3.5 py-2 font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-all"
          >
            {isDeleting ? "Deleting..." : "Delete Category"}
          </button>
        </div>
      </div>
    </div>
  );
}
