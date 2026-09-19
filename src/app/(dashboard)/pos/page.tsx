"use client";

import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  ChevronRight,
  Coins,
  CreditCard,
  FileText,
  HandCoins,
  Landmark,
  Minus,
  Package,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  User,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { createCustomer, createSale, getCustomers } from "@/lib/api/app-data";
import { getProducts } from "@/lib/api/shops";
import type { Customer, Product, Sale } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";


type CartItem = {
  product: Product;
  quantity: number;
  unitPrice: number;
};

type PaymentMethodType = "CASH" | "CARD" | "BANK" | "BANK_TRANSFER" | "TELEBIRR" | "MOBILE" | "DEBT";

/* ------------------------------------------------------------------ */
/* Modal: Quick Add Customer                                          */
/* ------------------------------------------------------------------ */
function QuickAddCustomerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}) {
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState("5000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await createCustomer(activeShopId, {
        name,
        phone: phone || "+251912345678",
        address: address || "Addis Ababa",
      });
      onCreated({
        ...created,
        creditLimit,
        debtBalance: "0",
        totalCreditPurchases: 0,
        totalPaid: 0,
        debtHistory: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-4 flex items-center justify-between border-b border-[#f3f4f6] pb-3">
          <h2 className="text-base font-semibold text-[#111827]">Register New Customer</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#6b7280] hover:bg-[#f3f4f6]">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="mb-1 block font-medium text-[#374151]">Customer Full Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmed Ali"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs focus:border-[#2563eb] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-[#374151]">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 91 234 5678"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-[#374151]">Address / Location</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Bole, Addis Ababa"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-[#374151]">Approved Credit Limit (ETB)</label>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-[#c0e763] px-5 py-2 font-bold text-zinc-950 shadow-sm transition-all hover:bg-[#b0d952] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Registering..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Debt Confirmation Dialog                                    */
/* ------------------------------------------------------------------ */
function DebtConfirmationModal({
  customer,
  currentDebt,
  debtToAdd,
  newTotalDebt,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  customer: Customer;
  currentDebt: number;
  debtToAdd: number;
  newTotalDebt: number;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 border-b border-[#f3f4f6] pb-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <HandCoins className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#111827]">Confirm Debt / Credit Sale</h2>
            <p className="text-xs text-[#6b7280]">This sale will increase customer outstanding balance</p>
          </div>
        </div>

        <div className="my-5 space-y-3 text-xs">
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Customer Name:</span>
              <span className="font-semibold text-[#111827]">{customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Phone Number:</span>
              <span className="font-mono text-[#374151]">{customer.phone || "-"}</span>
            </div>
            <div className="flex justify-between border-t border-amber-100/80 pt-2">
              <span className="text-[#6b7280]">Current Debt:</span>
              <span className="font-semibold text-[#111827]">{currentDebt.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-amber-800">Added to Debt:</span>
              <span className="text-[#dc2626]">+{debtToAdd.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between border-t border-amber-200 pt-2 text-sm font-bold">
              <span className="text-[#111827]">New Total Debt:</span>
              <span className="text-[#dc2626]">{newTotalDebt.toLocaleString()} ETB</span>
            </div>
          </div>

          <p className="text-center text-[11px] text-[#6b7280]">
            Are you sure you want to complete this sale as <strong className="text-[#111827]">Debt / Credit</strong>?
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold text-zinc-950 shadow-sm transition-all hover:bg-amber-500 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Completing..." : "Confirm & Charge Credit"}
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Sale Receipt / Success                                      */
/* ------------------------------------------------------------------ */
function SaleReceiptModal({
  sale,
  onClose,
  onNewSale,
}: {
  sale: Sale;
  onClose: () => void;
  onNewSale: () => void;
}) {
  const paid = sale.amountPaid !== undefined ? parseFloat(String(sale.amountPaid)) : (sale.splitDetails?.cashAmount ?? parseFloat(sale.totalAmount));
  const debt = sale.debtAmount !== undefined ? parseFloat(String(sale.debtAmount)) : (sale.splitDetails?.debtAmount ?? Math.max(0, parseFloat(sale.totalAmount) - paid));
  const isDebtSale = debt > 0;

  const methodLabel = sale.paymentMethod === "BANK" ? "Bank" : sale.paymentMethod === "TELEBIRR" ? "Telebirr" : "Cash";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex flex-col items-center border-b border-zinc-100 pb-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#f3fad9] text-zinc-950 ring-4 ring-[#c0e763]/20">
            <CheckCircle2 className="size-6 text-zinc-900 stroke-[2.5]" />
          </div>
          <h2 className="mt-3 text-base font-bold text-zinc-950">Sale Finalized</h2>
          <p className="font-mono text-[11px] font-medium text-zinc-400">REF: {sale.id.slice(0, 16)}</p>
        </div>

        {/* Receipt Content */}
        <div className="my-4 space-y-3 text-xs">
          {/* Customer / Method */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">Timestamp:</span>
              <span className="font-medium text-zinc-800">{new Date().toLocaleString()}</span>
            </div>
            {sale.customer && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Account:</span>
                <span className="font-bold text-zinc-900">{sale.customer.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Tender Type:</span>
              <span className="font-semibold text-zinc-900">{methodLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Collected:</span>
              <span className="font-mono font-bold text-emerald-600 tabular-nums">{paid.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* Items Summary */}
          <div className="max-h-36 overflow-y-auto rounded-xl border border-zinc-200/80 p-3 space-y-2">
            {sale.items?.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-800">
                  {it.quantity}x {it.product?.name || `Product #${it.productId.slice(0, 8)}`}
                </span>
                <span className="font-mono font-bold text-zinc-950 tabular-nums">{it.subtotal} ETB</span>
              </div>
            ))}
          </div>

          {/* Debt Summary Banner if Credit */}
          {isDebtSale && sale.customer && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs space-y-1">
              <div className="flex justify-between font-bold text-amber-900">
                <span>Credit Balance Added:</span>
                <span className="font-mono font-bold text-red-600 tabular-nums">+{debt.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-[11px] text-amber-800">
                <span>Updated Customer Ledger:</span>
                <span className="font-mono font-bold text-amber-950 tabular-nums">
                  {parseFloat(sale.customer.debtBalance || "0").toLocaleString()} ETB
                </span>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Grand Total</span>
            <span className="font-mono text-base font-bold text-zinc-950 tabular-nums">
              {parseFloat(sale.totalAmount).toLocaleString()} <span className="font-sans text-xs font-semibold text-zinc-500">ETB</span>
            </span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <Printer className="size-3.5 text-zinc-500" />
            Print Docket
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNewSale();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#c0e763] px-4 py-2 text-xs font-bold text-zinc-950 shadow-sm transition-all hover:bg-[#b0d952] active:scale-95"
          >
            <span>Next Transaction</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main POS Page Component                                            */
/* ------------------------------------------------------------------ */
export default function PosPage() {
  const activeShopId = useShopStore((state) => state.activeShopId) || MOCK_IDS.shop;

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountVal, setDiscountVal] = useState<number>(0);

  // Customer & Payment State (Cash, Bank, Telebirr only)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("CASH");
  const [amountPaidInput, setAmountPaidInput] = useState<string>("");

  // Modals
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [isDebtConfirmModalOpen, setIsDebtConfirmModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [prodList, custList] = await Promise.all([
        getProducts(activeShopId),
        getCustomers(activeShopId),
      ]);
      setProducts(prodList);
      setCustomers(custList);
    } catch {
      // Fallbacks in API
    } finally {
      setLoading(false);
    }
  }, [activeShopId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return ["ALL", ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === "ALL" || p.category?.name === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Selected Customer details
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  // Pricing calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountVal);
  }, [subtotal, discountVal]);

  // Effective Amount Paid & Remaining Debt Calculations
  const effectivePaid = useMemo(() => {
    if (amountPaidInput.trim() === "") return total;
    const val = parseFloat(amountPaidInput);
    return isNaN(val) ? total : Math.max(0, val);
  }, [amountPaidInput, total]);

  const debtAdditionAmount = useMemo(() => {
    return Math.max(0, total - effectivePaid);
  }, [total, effectivePaid]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== "CASH") return 0;
    return Math.max(0, effectivePaid - total);
  }, [paymentMethod, effectivePaid, total]);

  const currentCustomerDebt = selectedCustomer ? parseFloat(selectedCustomer.debtBalance || "0") : 0;
  const newProjectedDebt = currentCustomerDebt + debtAdditionAmount;

  // Cart Operations
  function addToCart(product: Product) {
    setValidationError("");
    if (product.stockQuantity <= 0) {
      setValidationError(`${product.name} is currently out of stock.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          setValidationError(`Cannot add more: max available stock (${product.stockQuantity} pcs) reached for ${product.name}.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: parseFloat(product.price || "0") }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setValidationError("");
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stockQuantity) {
              setValidationError(`Cannot exceed available stock (${item.product.stockQuantity} pcs) for ${item.product.name}.`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }

  function removeFromCart(productId: string) {
    setValidationError("");
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setDiscountVal(0);
    setAmountPaidInput("");
    setValidationError("");
  }

  // Pre-Checkout Validation
  function handleCheckoutClick() {
    setValidationError("");

    if (cart.length === 0) {
      setValidationError("Cart is empty. Please add products to checkout.");
      return;
    }

    // Validate Stock for all cart items before proceeding
    for (const it of cart) {
      if (it.quantity > it.product.stockQuantity) {
        setValidationError(`Insufficient stock for "${it.product.name}". Available: ${it.product.stockQuantity}, in cart: ${it.quantity}.`);
        return;
      }
    }

    // Debt & Customer Validation
    if (debtAdditionAmount > 0 && !selectedCustomer) {
      setValidationError(`Please select or register a customer for the outstanding debt of ${debtAdditionAmount.toLocaleString()} ETB.`);
      return;
    }

    if (debtAdditionAmount > 0 && selectedCustomer) {
      setIsDebtConfirmModalOpen(true);
      return;
    }

    // Direct sale execution
    executeSale();
  }

  // Execute Sale Submission
  async function executeSale() {
    setIsProcessing(true);
    setValidationError("");

    try {
      const sale = await createSale(activeShopId, {
        customerId: selectedCustomer?.id,
        items: cart.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          name: it.product.name,
        })),
        discountAmount: discountVal,
        totalAmount: total,
        amountPaid: effectivePaid,
        paymentMethod,
        notes: debtAdditionAmount > 0
          ? `Sale with ${paymentMethod} paid (${effectivePaid} ETB) + Remaining Debt (${debtAdditionAmount} ETB)`
          : `Full payment via ${paymentMethod}`,
      });

      // Reload products & customers state
      await loadData();

      // Show receipt modal
      setCompletedSale(sale);
      setIsDebtConfirmModalOpen(false);
      clearCart();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "message" in err
          ? String((err as any).message)
          : "Failed to complete sale. Please try again.";
      setValidationError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }


  if (loading) {
    return <LoadingState />;
  }


  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
      {/* ================================================================= */}
      {/* Left Column: Product Catalog & Category Filter                    */}
      {/* ================================================================= */}
      <div className="space-y-4">
        {/* Catalog Header & Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#111827]">POS Checkout</h1>
            <p className="text-xs text-[#6b7280]">Select items from catalog or scan SKU to add to cart</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name or SKU..."
              className="h-9 w-full rounded-xl border border-[#e5e7eb] bg-white pl-9 pr-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-[#c0e763] text-zinc-950 shadow-xs ring-1 ring-[#c0e763]"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const inCart = cart.find((it) => it.product.id === product.id);
            const isOutOfStock = product.stockQuantity <= 0;

            return (
              <div
                key={product.id}
                className={`group flex flex-col justify-between rounded-2xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-zinc-300 hover:shadow-md ${
                  inCart ? "border-zinc-950 ring-2 ring-[#c0e763]" : "border-zinc-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-600">
                      {product.sku}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        isOutOfStock
                          ? "text-red-600"
                          : product.stockQuantity < 10
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {isOutOfStock ? "Out of stock" : `${product.stockQuantity} in stock`}
                    </span>
                  </div>

                  <h3 className="mt-2.5 line-clamp-1 text-xs font-bold text-zinc-900">{product.name}</h3>
                  <p className="text-[11px] font-medium text-zinc-400">{product.category?.name || "General"}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <div className="font-mono font-bold text-zinc-950 tabular-nums text-sm">
                    {parseFloat(product.price || "0").toLocaleString()} <span className="font-sans text-[10px] font-semibold text-zinc-500">ETB</span>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className="flex size-7 items-center justify-center rounded-lg bg-zinc-950 text-white transition-all hover:bg-[#c0e763] hover:text-zinc-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Add to cart"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* Right Column: Active Cart & Debt Payment Panel                    */}
      {/* ================================================================= */}
      <div className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="space-y-4">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#f3fad9] text-zinc-950 ring-1 ring-[#c0e763]/60">
                <ShoppingCart className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-zinc-900">Current Order</h2>
                <span className="text-[11px] font-medium text-zinc-400">{cart.length} item types in cart</span>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] font-semibold text-red-600 hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="size-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Selected Customer Selector */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-[10px] text-zinc-500">Customer Account</label>
              <button
                type="button"
                onClick={() => setIsAddCustModalOpen(true)}
                className="flex items-center gap-1 font-semibold text-zinc-900 hover:underline"
              >
                <UserPlus className="size-3" />
                + New Customer
              </button>
            </div>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none"
            >
              <option value="">-- Select Customer (Walk-in / Cash) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({parseFloat(c.debtBalance || "0").toLocaleString()} ETB Debt)
                </option>
              ))}
            </select>

            {/* Selected Customer Debt Details */}
            {selectedCustomer && (
              <div className="flex items-center justify-between rounded-lg bg-white p-2 text-[11px] border border-[#e5e7eb]">
                <div>
                  <span className="font-medium text-[#111827]">{selectedCustomer.name}</span>
                  <span className="block text-[#9ca3af]">{selectedCustomer.phone || "No phone"}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#6b7280]">Current Debt:</span>
                  <div className="font-bold text-[#dc2626]">
                    {currentCustomerDebt.toLocaleString()} ETB
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-[#f3f4f6] pr-1">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between pt-2">
                  <div className="flex-1 pr-2">
                    <p className="truncate text-xs font-semibold text-[#111827]">{item.product.name}</p>
                    <span className="text-[11px] text-[#6b7280]">
                      {item.unitPrice.toLocaleString()} ETB each
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quantity Stepper */}
                    <div className="flex items-center rounded-lg border border-[#e5e7eb] bg-[#f9fafb]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="px-2 py-1 text-[#6b7280] hover:bg-white"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-[#111827]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="px-2 py-1 text-[#6b7280] hover:bg-white"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>

                    <span className="w-16 text-right text-xs font-bold text-[#111827]">
                      {(item.unitPrice * item.quantity).toLocaleString()} ETB
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[#9ca3af] hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-[#9ca3af]">
                No items added yet. Click products to add.
              </div>
            )}
          </div>

          {/* Payment Method Selector (Cash, Bank, Telebirr) */}
          <div className="space-y-2 border-t border-zinc-100 pt-3 text-xs">
            <label className="font-bold uppercase tracking-wider text-[11px] text-zinc-500">Payment Tender</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "CASH", label: "Cash", icon: Banknote },
                { id: "BANK", label: "Bank", icon: Landmark },
                { id: "TELEBIRR", label: "Telebirr", icon: Smartphone },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                const IconComponent = m.icon;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethodType)}
                    className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-2 text-center transition-all ${
                      isSelected
                        ? "border-zinc-950 bg-[#c0e763] text-zinc-950 shadow-sm ring-1 ring-zinc-950 font-bold"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <IconComponent className="size-5" />
                    <span className="mt-1 text-xs font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Amount Paid / Workflow Input */}
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[#374151]">Amount Paid by Customer:</label>
                <span className="text-[11px] text-[#6b7280]">Total: {total.toLocaleString()} ETB</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                  placeholder={String(total)}
                  className="h-9 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-bold text-[#111827] focus:border-[#2563eb] focus:outline-none"
                />
                <span className="text-xs font-semibold text-[#6b7280]">ETB</span>
              </div>

              {/* Quick shortcut pills */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setAmountPaidInput(String(total))}
                  className="rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[10px] font-medium text-[#374151] hover:bg-[#f3f4f6]"
                >
                  Pay Full ({total} ETB)
                </button>
                <button
                  type="button"
                  onClick={() => setAmountPaidInput(String(Math.round(total / 2)))}
                  className="rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-[10px] font-medium text-[#374151] hover:bg-[#f3f4f6]"
                >
                  Half ({Math.round(total / 2)} ETB)
                </button>
                <button
                  type="button"
                  onClick={() => setAmountPaidInput("0")}
                  className="rounded-md border border-red-200 bg-red-50/70 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100"
                >
                  0 (Full Debt)
                </button>
              </div>

              {/* Change calculation for Cash overpayment */}
              {changeAmount > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
                  <span>Cash Change to Return:</span>
                  <span>{changeAmount.toLocaleString()} ETB</span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Debt / Credit Summary Box (When Amount Paid < Total) */}
          {debtAdditionAmount > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2 text-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <HandCoins className="size-4 text-amber-700" />
                <span>Customer Debt / Credit Notice</span>
              </div>
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-amber-900/70">Selected Customer:</span>
                  <span className={`font-semibold ${selectedCustomer ? "text-amber-950" : "text-red-600 font-bold"}`}>
                    {selectedCustomer ? selectedCustomer.name : "⚠️ Required (None Selected)"}
                  </span>
                </div>
                {selectedCustomer && (
                  <div className="flex justify-between">
                    <span className="text-amber-900/70">Previous Debt Balance:</span>
                    <span className="font-semibold text-amber-950">{currentCustomerDebt.toLocaleString()} ETB</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-amber-800">
                  <span>Remaining Added to Debt:</span>
                  <span className="text-red-600">+{debtAdditionAmount.toLocaleString()} ETB</span>
                </div>
                {selectedCustomer && (
                  <div className="flex justify-between border-t border-amber-200 pt-1.5 text-xs font-bold text-red-700">
                    <span>New Total Customer Debt:</span>
                    <span>{newProjectedDebt.toLocaleString()} ETB</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


        {/* ================================================================= */}
        {/* Cart Total & Checkout Action                                      */}
        {/* ================================================================= */}
        <div className="mt-4 space-y-3 border-t border-[#e5e7eb] pt-3 text-xs">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[#6b7280]">
              <span>Subtotal</span>
              <span className="font-medium text-[#111827]">{subtotal.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between text-[#6b7280]">
              <span>Discount</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={discountVal || ""}
                  onChange={(e) => setDiscountVal(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="h-6 w-16 rounded border border-[#e5e7eb] bg-[#f9fafb] px-1.5 text-right text-xs"
                />
                <span>ETB</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between border-t border-zinc-100 pt-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Payable</span>
              <span className="font-mono text-lg font-bold text-zinc-950 tabular-nums">
                {total.toLocaleString()} <span className="font-sans text-xs font-semibold text-zinc-500">ETB</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing || cart.length === 0}
            onClick={handleCheckoutClick}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold tracking-tight shadow-md transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 ${
              debtAdditionAmount > 0
                ? "bg-amber-400 text-zinc-950 shadow-amber-400/20 hover:bg-amber-500"
                : "bg-[#c0e763] text-zinc-950 shadow-[#c0e763]/25 hover:bg-[#b0d952]"
            }`}
          >
            {isProcessing ? (
              <span className="font-medium">Processing Transaction...</span>
            ) : debtAdditionAmount > 0 ? (
              <>
                <HandCoins className="size-4" />
                <span>Complete Sale (+{debtAdditionAmount.toLocaleString()} ETB Debt)</span>
              </>
            ) : (
              <>
                <Check className="size-4 stroke-[3]" />
                <span>Charge {total.toLocaleString()} ETB</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* ================================================================= */}
      {/* Modals Container                                                  */}
      {/* ================================================================= */}
      {isAddCustModalOpen && (
        <QuickAddCustomerModal
          onClose={() => setIsAddCustModalOpen(false)}
          onCreated={(cust) => {
            setCustomers((prev) => [cust, ...prev]);
            setSelectedCustomerId(cust.id);
            setIsAddCustModalOpen(false);
          }}
        />
      )}

      {isDebtConfirmModalOpen && selectedCustomer && (
        <DebtConfirmationModal
          customer={selectedCustomer}
          currentDebt={currentCustomerDebt}
          debtToAdd={debtAdditionAmount}
          newTotalDebt={newProjectedDebt}
          onClose={() => setIsDebtConfirmModalOpen(false)}
          onConfirm={executeSale}
          isSubmitting={isProcessing}
        />
      )}

      {completedSale && (
        <SaleReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
          onNewSale={() => {
            setCompletedSale(null);
            clearCart();
          }}
        />
      )}
    </div>
  );
}
