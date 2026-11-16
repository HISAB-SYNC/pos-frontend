"use client";

import { Plus, X } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { useT } from "@/lib/i18n/use-t";
import { type NamedSupplier, matchSuppliers, resolveSupplier } from "@/lib/utils/supplier-match";

/**
 * One text field for choosing a supplier: type a few letters and the saved
 * suppliers that start with them (then ones that contain them) are listed;
 * pick one, or keep typing a new name and choose "Add … as a new supplier".
 * The parent keeps the text and asks `resolveSupplier` what it stands for.
 */
export function SupplierCombobox({
  suppliers,
  text,
  onTextChange,
  placeholder,
  invalid = false,
}: {
  suppliers: NamedSupplier[];
  text: string;
  onTextChange: (text: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const t = useT();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const matches = useMemo(() => matchSuppliers(suppliers, text, 8), [suppliers, text]);
  const choice = useMemo(() => resolveSupplier(suppliers, text), [suppliers, text]);
  const canAddNew = choice?.kind === "new";
  // Options: the matching suppliers, then "Add … as a new supplier" when the text is not an exact match
  const optionCount = matches.length + (canAddNew ? 1 : 0);

  function pick(name: string) {
    onTextChange(name);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (optionCount === 0 ? -1 : (i + 1) % optionCount));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (optionCount === 0 ? -1 : (i <= 0 ? optionCount - 1 : i - 1)));
    } else if (e.key === "Enter") {
      // Choosing from the list must not submit the form behind it.
      if (open && active >= 0) {
        e.preventDefault();
        if (active < matches.length) pick(matches[active].name);
        else if (choice) pick(choice.name);
      }
    } else if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={text}
        placeholder={placeholder ?? t("suppliers.combo.placeholder")}
        onChange={(e) => {
          onTextChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={`h-9 w-full rounded-md border bg-white pl-3 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus:ring-1 focus:outline-hidden ${
          invalid
            ? "border-amber-400 focus:border-amber-500 focus:ring-amber-400"
            : "border-zinc-200 focus:border-[#5B4FE9] focus:ring-[#5B4FE9]"
        }`}
      />
      {text && (
        <button
          type="button"
          // mousedown (not click) so the input keeps focus and the list does not flicker closed
          onMouseDown={(e) => {
            e.preventDefault();
            onTextChange("");
            setActive(-1);
          }}
          aria-label={t("suppliers.combo.clear")}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X className="size-3.5" />
        </button>
      )}

      {open && (optionCount > 0 || suppliers.length === 0) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-10 z-30 max-h-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 text-xs shadow-xl"
        >
          {matches.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={active === i}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s.name);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 font-medium text-zinc-800 ${active === i ? "bg-indigo-50" : "hover:bg-zinc-50"}`}
            >
              {s.name}
            </li>
          ))}
          {canAddNew && choice && (
            <li
              id={`${listId}-${matches.length}`}
              role="option"
              aria-selected={active === matches.length}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(choice.name);
              }}
              onMouseEnter={() => setActive(matches.length)}
              className={`flex cursor-pointer items-center gap-1.5 border-t border-zinc-100 px-3 py-2 font-semibold text-[#5B4FE9] ${
                active === matches.length ? "bg-indigo-50" : "hover:bg-zinc-50"
              }`}
            >
              <Plus className="size-3.5 shrink-0" />
              <span className="truncate">{t("suppliers.combo.addNew", { name: choice.name })}</span>
            </li>
          )}
          {suppliers.length === 0 && !text && <li className="px-3 py-2 text-zinc-500">{t("suppliers.combo.empty")}</li>}
        </ul>
      )}
    </div>
  );
}
