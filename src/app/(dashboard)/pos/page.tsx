"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Coins,
  CreditCard,
  FileText,
  HandCoins,
  Minus,
  Package,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
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

type PaymentMethodType = "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE" | "DEBT";

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

          <div className="mt-5 flex justify-end gap-2 border-t border-[#f3f4f6] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-lg bg-[#111827] px-5 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Save Customer"}
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

        <div className="flex justify-end gap-2 border-t border-[#f3f4f6] pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-lg bg-[#111827] px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Confirm & Complete Sale"}
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
  const isDebtSale = sale.paymentMethod === "DEBT" || sale.paymentMethod === "CREDIT" || sale.paymentMethod === "SPLIT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex flex-col items-center border-b border-[#f3f4f6] pb-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-6" />
          </div>
          <h2 className="mt-2 text-base font-bold text-[#111827]">Sale Completed Successfully!</h2>
          <p className="font-mono text-xs text-[#6b7280]">{sale.id}</p>
        </div>

        {/* Receipt Content */}
        <div className="my-4 space-y-3 text-xs">
          {/* Customer / Method */}
          <div className="rounded-xl bg-[#f9fafb] p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Date:</span>
              <span className="text-[#111827]">{new Date().toLocaleString()}</span>
            </div>
            {sale.customer && (
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Customer:</span>
                <span className="font-semibold text-[#111827]">{sale.customer.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Payment Method:</span>
              <span className="font-semibold text-[#111827]">
                {sale.paymentMethod === "DEBT"
                  ? "Debt / Credit"
                  : sale.paymentMethod === "SPLIT"
                  ? "Partial Cash + Debt"
                  : sale.paymentMethod}
              </span>
            </div>
          </div>

          {/* Items Summary */}
          <div className="max-h-36 overflow-y-auto rounded-xl border border-[#e5e7eb] p-3 space-y-2">
            {sale.items?.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-[#374151]">
                  {it.quantity}x Product #{it.productId.slice(0, 8)}
                </span>
                <span className="font-semibold text-[#111827]">{it.subtotal} ETB</span>
              </div>
            ))}
          </div>

          {/* Debt Summary Banner if Credit */}
          {isDebtSale && sale.customer && (
            <div className="rounded-xl border border-red-100 bg-red-50/70 p-3 text-xs space-y-1">
              <div className="flex justify-between font-semibold text-red-800">
                <span>Added to Customer Debt:</span>
                <span>
                  +
                  {sale.splitDetails?.debtAmount
                    ? sale.splitDetails.debtAmount.toLocaleString()
                    : parseFloat(sale.totalAmount).toLocaleString()}{" "}
                  ETB
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-red-700">
                <span>New Total Debt Balance:</span>
                <span className="font-bold">
                  {parseFloat(sale.customer.debtBalance || "0").toLocaleString()} ETB
                </span>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-2 text-sm font-bold">
            <span className="text-[#111827]">Total Paid / Charged:</span>
            <span className="text-base text-[#111827]">{parseFloat(sale.totalAmount).toLocaleString()} ETB</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="mt-5 flex items-center justify-between border-t border-[#f3f4f6] pt-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-3.5 py-2 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
          >
            <Printer className="size-3.5 text-[#6b7280]" />
            Print Receipt
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNewSale();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#111827] px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
          >
            Start New Sale
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

  // Customer & Payment State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("CASH");
  const [isPartialSplit, setIsPartialSplit] = useState(false);
  const [cashPaidPart, setCashPaidPart] = useState<string>("");

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

  // Debt Calculations
  const currentCustomerDebt = selectedCustomer ? parseFloat(selectedCustomer.debtBalance || "0") : 0;

  const debtAdditionAmount = useMemo(() => {
    if (paymentMethod === "DEBT") return total;
    if (isPartialSplit) {
      const cash = parseFloat(cashPaidPart) || 0;
      return Math.max(0, total - cash);
    }
    return 0;
  }, [paymentMethod, isPartialSplit, cashPaidPart, total]);

  const newProjectedDebt = currentCustomerDebt + debtAdditionAmount;

  // Cart Operations
  function addToCart(product: Product) {
    if (product.stockQuantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: parseFloat(product.price || "0") }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stockQuantity) return item;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
    setDiscountVal(0);
    setIsPartialSplit(false);
    setCashPaidPart("");
    setValidationError("");
  }

  // Pre-Checkout Validation
  function handleCheckoutClick() {
    setValidationError("");

    if (cart.length === 0) {
      setValidationError("Cart is empty. Please add products to checkout.");
      return;
    }

    const isDebt = paymentMethod === "DEBT" || (isPartialSplit && debtAdditionAmount > 0);

    // Rule: When Debt/Credit is selected, a customer MUST be selected.
    if (isDebt && !selectedCustomer) {
      setValidationError("Please select or register a customer to complete a Debt/Credit sale.");
      return;
    }

    if (isDebt && selectedCustomer) {
      // Show confirmation dialog before completing debt sale
      setIsDebtConfirmModalOpen(true);
      return;
    }

    // Execute direct sale for Cash, Card, Bank, Mobile
    executeSale();
  }

  // Execute Sale Submission
  async function executeSale() {
    setIsProcessing(true);
    setValidationError("");

    try {
      const finalPaymentMethod = isPartialSplit ? "SPLIT" : paymentMethod;
      const splitDetails = isPartialSplit
        ? {
            cashAmount: parseFloat(cashPaidPart) || 0,
            debtAmount: debtAdditionAmount,
            paymentMethod: "CASH_AND_DEBT",
          }
        : undefined;

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
        paymentMethod: finalPaymentMethod,
        splitDetails,
        notes: isPartialSplit
          ? `Split Sale: Cash (${cashPaidPart} ETB) + Debt (${debtAdditionAmount} ETB)`
          : paymentMethod === "DEBT"
          ? "Full Debt / Credit Sale"
          : undefined,
      });

      // Reload products & customers state
      await loadData();

      // Show receipt modal
      setCompletedSale(sale);
      setIsDebtConfirmModalOpen(false);
      clearCart();
    } catch {
      setValidationError("Failed to complete sale. Please try again.");
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
              className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-[#111827] text-white shadow-sm"
                  : "border border-[#e5e7eb] bg-white text-[#4b5563] hover:bg-[#f9fafb]"
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
                className={`group flex flex-col justify-between rounded-2xl border bg-white p-3.5 shadow-sm transition-all hover:shadow-md ${
                  inCart ? "border-blue-500 ring-1 ring-blue-500" : "border-[#e5e7eb]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="rounded-md bg-[#f3f4f6] px-2 py-0.5 font-mono text-[10px] font-medium text-[#6b7280]">
                      {product.sku}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        isOutOfStock
                          ? "text-red-500"
                          : product.stockQuantity < 10
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {isOutOfStock ? "Out of stock" : `${product.stockQuantity} in stock`}
                    </span>
                  </div>

                  <h3 className="mt-2 line-clamp-1 text-xs font-bold text-[#111827]">{product.name}</h3>
                  <p className="text-[11px] text-[#9ca3af]">{product.category?.name || "General"}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#f3f4f6] pt-3">
                  <div className="font-bold text-[#111827]">
                    {parseFloat(product.price || "0").toLocaleString()} <span className="text-[10px] font-normal text-[#6b7280]">ETB</span>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className="flex size-7 items-center justify-center rounded-lg bg-[#111827] text-white transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
      <div className="flex flex-col justify-between rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <div className="space-y-4">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShoppingCart className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#111827]">Current Order</h2>
                <span className="text-[11px] text-[#9ca3af]">{cart.length} item types in cart</span>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] font-medium text-red-600 hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="size-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Selected Customer Selector */}
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#374151]">Customer Selection</label>
              <button
                type="button"
                onClick={() => setIsAddCustModalOpen(true)}
                className="flex items-center gap-1 font-semibold text-blue-600 hover:underline"
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

          {/* Payment Method Selector */}
          <div className="space-y-2 border-t border-[#f3f4f6] pt-3 text-xs">
            <label className="font-semibold text-[#374151]">Payment Method</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "CASH", label: "Cash", icon: "💵" },
                { id: "CARD", label: "Card", icon: "💳" },
                { id: "MOBILE", label: "Mobile", icon: "📱" },
                { id: "BANK_TRANSFER", label: "Bank Transfer", icon: "🏦" },
                { id: "DEBT", label: "Debt / Credit", icon: "📑" },
              ].map((m) => {
                const isSelected = paymentMethod === m.id && !isPartialSplit;
                const isDebt = m.id === "DEBT";

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as PaymentMethodType);
                      setIsPartialSplit(false);
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                      isSelected
                        ? isDebt
                          ? "border-[#dc2626] bg-red-50 text-red-700 shadow-sm ring-1 ring-red-500"
                          : "border-[#111827] bg-[#111827] text-white shadow-sm"
                        : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                    } ${m.id === "DEBT" ? "col-span-2 font-bold" : ""}`}
                  >
                    <span className="text-base">{m.icon}</span>
                    <span className="mt-0.5 text-[11px] font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Split / Partial Payment Toggle */}
            <div className="mt-2 flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-2.5">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#374151]">
                <input
                  type="checkbox"
                  checked={isPartialSplit}
                  onChange={(e) => setIsPartialSplit(e.target.checked)}
                  className="size-3.5 rounded border-[#d1d5db] text-[#111827]"
                />
                <span>Split / Partial Debt (Cash + Debt)</span>
              </label>
            </div>

            {/* Partial Payment Input Field */}
            {isPartialSplit && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Total Sale:</span>
                  <span className="font-bold text-[#111827]">{total.toLocaleString()} ETB</span>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#374151]">Cash Amount Paid:</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      value={cashPaidPart}
                      onChange={(e) => setCashPaidPart(e.target.value)}
                      placeholder="e.g. 400"
                      className="h-8 w-full rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-xs font-semibold text-[#111827] focus:border-[#2563eb] focus:outline-none"
                    />
                    <span className="text-xs font-medium text-[#6b7280]">ETB</span>
                  </div>
                </div>
                <div className="flex justify-between border-t border-amber-200 pt-1.5 font-semibold text-red-700">
                  <span>Remaining Added to Debt:</span>
                  <span>+{debtAdditionAmount.toLocaleString()} ETB</span>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Debt Calculation Box */}
          {(paymentMethod === "DEBT" || (isPartialSplit && debtAdditionAmount > 0)) && (
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-800">
                <HandCoins className="size-4" />
                <span>Debt / Credit Summary</span>
              </div>
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-red-900/70">Customer:</span>
                  <span className="font-semibold text-red-950">{selectedCustomer?.name || "Not Selected"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-900/70">Current Debt:</span>
                  <span className="font-bold text-red-950">{currentCustomerDebt.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between font-semibold text-red-800">
                  <span>Current Sale Added to Debt:</span>
                  <span>+{debtAdditionAmount.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between border-t border-red-200 pt-1.5 text-xs font-bold text-[#dc2626]">
                  <span>New Total Debt:</span>
                  <span>{newProjectedDebt.toLocaleString()} ETB</span>
                </div>
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
            <div className="flex justify-between border-t border-[#e5e7eb] pt-2 text-sm font-bold text-[#111827]">
              <span>Total Payable</span>
              <span className="text-base text-[#111827]">{total.toLocaleString()} ETB</span>
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing || cart.length === 0}
            onClick={handleCheckoutClick}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${
              paymentMethod === "DEBT" || (isPartialSplit && debtAdditionAmount > 0)
                ? "bg-[#dc2626] hover:bg-red-700"
                : "bg-[#111827] hover:bg-slate-800"
            }`}
          >
            {isProcessing ? (
              "Processing..."
            ) : paymentMethod === "DEBT" ? (
              <>
                <HandCoins className="size-4" />
                Complete Debt Sale ({total.toLocaleString()} ETB)
              </>
            ) : (
              <>
                <Check className="size-4" />
                Complete Sale ({total.toLocaleString()} ETB)
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
