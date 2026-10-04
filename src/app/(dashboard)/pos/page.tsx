"use client";

import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  ChevronRight,
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { createCustomer, createSale, getCustomers, saveCreditSaleItems } from "@/lib/api/app-data";
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

const POPULAR_BANKS = [
  "Commercial Bank of Ethiopia (CBE)",
  "Awash Bank",
  "Bank of Abyssinia (BOA)",
  "Dashen Bank",
  "Cooperative Bank of Oromia",
  "Telebirr",
  "Other Bank / Custom",
];

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
        name: name.trim(),
        phone: phone.trim() || "+251912345678",
        address: address.trim() || "Addis Ababa",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xl animate-in zoom-in-95 duration-100">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-950">Register New Customer</h2>
            <p className="text-[11px] text-zinc-500">Record customer profile for cash or debt transactions</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block font-medium text-zinc-700">Full Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmed Ali"
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:outline-none focus:ring-1 focus:ring-[#5B4FE9]/30"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-700">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 91 234 5678"
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:outline-none focus:ring-1 focus:ring-[#5B4FE9]/30"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-700">Address / Location</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Bole, Addis Ababa"
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:outline-none focus:ring-1 focus:ring-[#5B4FE9]/30"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-700">Credit Limit (ETB)</label>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-xs text-zinc-900 focus:border-[#5B4FE9] focus:outline-none focus:ring-1 focus:ring-[#5B4FE9]/30"
            />
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-zinc-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-200 bg-white px-3.5 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-md bg-slate-900 px-4 py-1.5 font-semibold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Customer"}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xl animate-in zoom-in-95 duration-100">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-400/30">
            <HandCoins className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-950">Confirm Credit / Debt Sale</h2>
            <p className="text-[11px] text-zinc-500">Record customer debt obligation on store ledger</p>
          </div>
        </div>

        <div className="my-4 space-y-3 text-xs">
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 p-3.5 space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-600">Customer Name:</span>
              <span className="font-semibold text-zinc-900">{customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Phone:</span>
              <span className="font-mono text-zinc-800">{customer.phone || "—"}</span>
            </div>
            <div className="flex justify-between border-t border-amber-200/60 pt-2">
              <span className="text-zinc-600">Previous Debt Balance:</span>
              <span className="font-mono font-medium text-zinc-900 tabular-nums">{currentDebt.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-amber-800">New Added Debt:</span>
              <span className="font-mono text-rose-600 tabular-nums">+{debtToAdd.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between border-t border-amber-300 pt-2 text-sm font-bold">
              <span className="text-zinc-950">New Total Customer Debt:</span>
              <span className="font-mono text-rose-700 tabular-nums">{newTotalDebt.toLocaleString()} ETB</span>
            </div>
          </div>

          <p className="text-center text-[11px] text-zinc-500">
            This sale will be logged as an open credit voucher linked to {customer.name}.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-md bg-[#5B4FE9] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#4D40D9] disabled:opacity-50"
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

  const methodLabel = sale.paymentMethod === "BANK" ? "Bank Transfer" : sale.paymentMethod === "TELEBIRR" ? "Telebirr" : "Cash";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-100">
        {/* Receipt Header */}
        <div className="flex flex-col items-center border-b border-zinc-100 pb-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
            <CheckCircle2 className="size-5" />
          </div>
          <h2 className="mt-2.5 text-sm font-bold text-zinc-950">Sale Completed Successfully</h2>
          <p className="font-mono text-[10px] text-zinc-400">RECEIPT #{sale.id.slice(0, 12).toUpperCase()}</p>
        </div>

        {/* Receipt Slip */}
        <div className="my-3 space-y-2.5 text-xs">
          <div className="rounded-md border border-zinc-100 bg-zinc-50/70 p-2.5 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Date &amp; Time:</span>
              <span className="font-medium text-zinc-800">{new Date().toLocaleString()}</span>
            </div>
            {sale.customer && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="font-bold text-zinc-900">{sale.customer.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Tender Method:</span>
              <span className="font-semibold text-zinc-900">{methodLabel}</span>
            </div>
            {sale.bankName && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Bank / Channel:</span>
                <span className="font-medium text-zinc-800">{sale.bankName}</span>
              </div>
            )}
            {sale.paymentReference && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Reference:</span>
                <span className="font-mono text-zinc-800">{sale.paymentReference}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-zinc-200/60 pt-1">
              <span className="text-zinc-500">Amount Tendered:</span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">{paid.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* Items Summary Table */}
          <div className="max-h-32 overflow-y-auto rounded-md border border-zinc-200/80 p-2.5 space-y-1.5 text-[11px]">
            {sale.items?.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="truncate pr-2 font-medium text-zinc-800">
                  {it.quantity}x {it.product?.name || `Item #${it.productId.slice(0, 6)}`}
                </span>
                <span className="font-mono font-semibold text-zinc-900 tabular-nums shrink-0">{it.subtotal} ETB</span>
              </div>
            ))}
          </div>

          {/* Credit Debt Notice if applicable */}
          {isDebtSale && (
            <div className="rounded-md border border-amber-200 bg-amber-50/80 p-2.5 text-[11px] space-y-1">
              <div className="flex justify-between font-bold text-amber-900">
                <span>Credit Balance Added:</span>
                <span className="font-mono text-rose-600 tabular-nums">+{debt.toLocaleString()} ETB</span>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex items-baseline justify-between border-t border-zinc-100 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Grand Total</span>
            <span className="font-mono text-base font-bold text-zinc-950 tabular-nums">
              {parseFloat(sale.totalAmount).toLocaleString()} <span className="font-sans text-xs font-semibold text-zinc-500">ETB</span>
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
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
            className="flex items-center gap-1.5 rounded-md bg-[#5B4FE9] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#4D40D9]"
          >
            <span>Next Customer</span>
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

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

  // Payment State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("CASH");
  const [bankName, setBankName] = useState<string>("Commercial Bank of Ethiopia (CBE)");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [amountPaidInput, setAmountPaidInput] = useState<string>("");

  // Modals
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [isDebtConfirmModalOpen, setIsDebtConfirmModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Autofocus search on '/' key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== searchInputRef.current && !(document.activeElement instanceof HTMLInputElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [prodList, custList] = await Promise.all([
        getProducts(activeShopId),
        getCustomers(activeShopId),
      ]);
      setProducts(prodList);
      setCustomers(custList);
    } catch {
      // Graceful fallback
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

  // Selected Customer
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  // Totals calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountVal);
  }, [subtotal, discountVal]);

  // Amount Paid & Debt
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
          setValidationError(`Max available stock (${product.stockQuantity} pcs) reached for ${product.name}.`);
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
    setPaymentReference("");
    setValidationError("");
  }

  function handleCheckoutClick() {
    setValidationError("");

    if (cart.length === 0) {
      setValidationError("Cart is empty. Please add products to checkout.");
      return;
    }

    for (const it of cart) {
      if (it.quantity > it.product.stockQuantity) {
        setValidationError(`Insufficient stock for "${it.product.name}". Available: ${it.product.stockQuantity}, in cart: ${it.quantity}.`);
        return;
      }
    }

    if (debtAdditionAmount > 0 && !selectedCustomer) {
      setValidationError(`Please select or register a customer for the outstanding credit balance of ${debtAdditionAmount.toLocaleString()} ETB.`);
      return;
    }

    if (debtAdditionAmount > 0 && selectedCustomer) {
      setIsDebtConfirmModalOpen(true);
      return;
    }

    executeSale();
  }

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
        bankName: paymentMethod === "CASH" ? undefined : bankName,
        paymentReference: paymentMethod === "CASH" ? undefined : (paymentReference.trim() || undefined),
        notes: debtAdditionAmount > 0
          ? `Sale with ${paymentMethod} paid (${effectivePaid} ETB) + Remaining Debt (${debtAdditionAmount} ETB)`
          : `Full payment via ${paymentMethod}`,
      });

      if (debtAdditionAmount > 0 && selectedCustomer) {
        const debtItems = cart.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.unitPrice * it.quantity,
          name: it.product.name,
        }));
        if (sale && sale.id) {
          saveCreditSaleItems(sale.id, debtItems);
        }
        if (selectedCustomer.id) {
          saveCreditSaleItems(selectedCustomer.id, debtItems);
        }
      }

      await loadData();
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

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      {/* Mobile / Tablet Segmented Switcher (Products vs Cart) */}
      <div className="flex rounded-md bg-zinc-100 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("catalog")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition-all ${
            mobileTab === "catalog"
              ? "bg-white text-zinc-950 shadow-2xs"
              : "text-zinc-600 hover:text-zinc-950"
          }`}
        >
          <Package className="size-3.5" />
          <span>Catalog ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("cart")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition-all ${
            mobileTab === "cart"
              ? "bg-white text-zinc-950 shadow-2xs"
              : "text-zinc-600 hover:text-zinc-950"
          }`}
        >
          <ShoppingCart className="size-3.5" />
          <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="rounded bg-[#5B4FE9] px-1.5 py-0.2 font-mono text-[10px] font-bold text-white">
              {total.toLocaleString()} ETB
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_420px]">
        {/* ================================================================= */}
        {/* Left Column: Product Catalog & Category Filters                   */}
        {/* ================================================================= */}
        <div className={`space-y-3.5 ${mobileTab === "cart" ? "hidden lg:block" : "block"}`}>
          {/* Header & Quick Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-950">POS Terminal</h1>
              <p className="text-xs text-zinc-500">Scan barcode, search SKU, or tap items to add to cart</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or SKU (Press / to focus)..."
                className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-10 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:outline-none focus:ring-1 focus:ring-[#5B4FE9]/30"
              />
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-mono text-[9px] text-zinc-400">
                  /
                </kbd>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-2xs font-semibold"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                {cat === "ALL" ? "All Categories" : cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const inCart = cart.find((it) => it.product.id === product.id);
              const isOutOfStock = product.stockQuantity <= 0;

              return (
                <div
                  key={product.id}
                  className={`group flex flex-col justify-between rounded-lg border bg-white p-3 shadow-2xs transition-all hover:border-zinc-300 ${
                    inCart ? "border-[#5B4FE9] ring-1 ring-[#5B4FE9]/30" : "border-zinc-200/90"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-zinc-600">
                        {product.sku}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 ${
                          isOutOfStock
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : product.stockQuantity < 10
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isOutOfStock ? "Out" : `${product.stockQuantity} left`}
                      </span>
                    </div>

                    <h3 className="mt-2 line-clamp-1 text-xs font-bold text-zinc-900">{product.name}</h3>
                    <p className="text-[10px] text-zinc-400">{product.category?.name || "General"}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5">
                    <div className="font-mono text-sm font-bold text-zinc-950 tabular-nums">
                      {parseFloat(product.price || "0").toLocaleString()}{" "}
                      <span className="font-sans text-[10px] font-semibold text-zinc-400">ETB</span>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(product)}
                      className="flex size-7 items-center justify-center rounded-md bg-slate-900 text-white transition-all hover:bg-[#5B4FE9] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Add item to cart"
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
        {/* Right Column: Active Cart & Tender Panel                          */}
        {/* ================================================================= */}
        <div className={`flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs ${mobileTab === "catalog" ? "hidden lg:flex" : "flex"}`}>
          <div className="space-y-3.5">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-indigo-50 text-[#5B4FE9] ring-1 ring-[#5B4FE9]/20">
                  <ShoppingCart className="size-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Current Order</h2>
                  <span className="text-[10px] text-zinc-400">{cart.length} item types in cart</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileTab("catalog")}
                  className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 lg:hidden"
                >
                  ← Catalog
                </button>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] font-medium text-rose-600 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Validation Message */}
            {validationError && (
              <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700">
                <AlertCircle className="size-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Selected Customer Selector */}
            <div className="rounded-lg border border-zinc-200/90 bg-zinc-50/70 p-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Customer Account</label>
                <button
                  type="button"
                  onClick={() => setIsAddCustModalOpen(true)}
                  className="flex items-center gap-1 font-semibold text-zinc-900 hover:underline"
                >
                  <UserPlus className="size-3 text-zinc-500" />
                  + Register Customer
                </button>
              </div>

              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:outline-none"
              >
                <option value="">Walk-in Customer (Instant Cash)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({parseFloat(c.debtBalance || "0").toLocaleString()} ETB Debt)
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="flex items-center justify-between rounded-md bg-white p-2 text-[11px] border border-zinc-200/80">
                  <div>
                    <span className="font-semibold text-zinc-900">{selectedCustomer.name}</span>
                    <span className="block text-zinc-400 font-mono text-[10px]">{selectedCustomer.phone || "No phone"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400">Current Debt:</span>
                    <div className="font-mono font-bold text-rose-600 tabular-nums">
                      {currentCustomerDebt.toLocaleString()} ETB
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-zinc-100 pr-1">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between pt-1.5">
                    <div className="flex-1 pr-2 min-w-0">
                      <p className="truncate text-xs font-semibold text-zinc-900">{item.product.name}</p>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {item.unitPrice.toLocaleString()} ETB each
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center rounded-md border border-zinc-200 bg-zinc-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="px-2 py-1 text-zinc-500 hover:bg-white hover:text-zinc-900 rounded-l"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center font-mono text-xs font-bold text-zinc-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="px-2 py-1 text-zinc-500 hover:bg-white hover:text-zinc-900 rounded-r"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <span className="w-16 text-right font-mono text-xs font-bold text-zinc-950 tabular-nums">
                        {(item.unitPrice * item.quantity).toLocaleString()} ETB
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-zinc-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-7 text-center text-xs text-zinc-400">
                  Cart is empty. Select products or scan SKU.
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 border-t border-zinc-100 pt-3 text-xs">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tender Channel</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "CASH", label: "Cash", icon: Banknote },
                  { id: "BANK", label: "Bank Transfer", icon: Landmark },
                  { id: "TELEBIRR", label: "Telebirr", icon: Smartphone },
                ].map((m) => {
                  const isSelected = paymentMethod === m.id;
                  const IconComponent = m.icon;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        const nextMethod = m.id as PaymentMethodType;
                        setPaymentMethod(nextMethod);
                        if (nextMethod === "TELEBIRR") {
                          setBankName("Telebirr");
                        } else if (nextMethod === "BANK" && bankName === "Telebirr") {
                          setBankName("Commercial Bank of Ethiopia (CBE)");
                        }
                      }}
                      className={`flex flex-col items-center justify-center rounded-md border py-2 px-1.5 text-center transition-all ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow-2xs font-semibold"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      <IconComponent className="size-4" />
                      <span className="mt-1 text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bank Details when non-cash */}
              {paymentMethod !== "CASH" && (
                <div className="rounded-md border border-zinc-200/90 bg-zinc-50/70 p-2.5 space-y-2 text-xs">
                  {paymentMethod === "BANK" ? (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                        Bank Name:
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 focus:border-[#5B4FE9] focus:outline-none"
                      >
                        {POPULAR_BANKS.filter((b) => b !== "Telebirr").map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                        Mobile Wallet:
                      </label>
                      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
                        <Smartphone className="size-3.5 text-emerald-600" />
                        <span>Telebirr Instant Transfer</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                      TxID / Reference (Optional):
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="e.g. FT2409... or Slip #"
                      className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-[#5B4FE9] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Amount Paid & Quick Ethiopian Birr Tender Chips */}
              <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-2.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Amount Tendered:</label>
                  <span className="font-mono text-[11px] font-semibold text-zinc-600">Total: {total.toLocaleString()} ETB</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    placeholder={String(total)}
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 font-mono text-xs font-bold text-zinc-900 focus:border-[#5B4FE9] focus:outline-none"
                  />
                  <span className="text-xs font-semibold text-zinc-500">ETB</span>
                </div>

                {/* Cashier Speed Quick Tender Chips */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setAmountPaidInput(String(total))}
                    className="rounded border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-800 hover:bg-zinc-100"
                  >
                    Exact ({total} ETB)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaidInput(String(total + 50))}
                    className="rounded border border-zinc-200 bg-white px-1.5 py-1 text-[10px] font-mono text-zinc-700 hover:bg-zinc-100"
                  >
                    +50 ETB
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaidInput(String(total + 100))}
                    className="rounded border border-zinc-200 bg-white px-1.5 py-1 text-[10px] font-mono text-zinc-700 hover:bg-zinc-100"
                  >
                    +100 ETB
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaidInput(String(total + 500))}
                    className="rounded border border-zinc-200 bg-white px-1.5 py-1 text-[10px] font-mono text-zinc-700 hover:bg-zinc-100"
                  >
                    +500 ETB
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaidInput(String(Math.round(total / 2)))}
                    className="rounded border border-zinc-200 bg-white px-1.5 py-1 text-[10px] font-mono text-zinc-700 hover:bg-zinc-100"
                  >
                    Half
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaidInput("0")}
                    className="rounded border border-rose-200 bg-rose-50 px-1.5 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    0 (Full Credit)
                  </button>
                </div>

                {/* Change calculation */}
                {changeAmount > 0 && (
                  <div className="flex items-center justify-between rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-bold text-emerald-800">
                    <span>Cash Change Due:</span>
                    <span className="font-mono text-emerald-900 tabular-nums">{changeAmount.toLocaleString()} ETB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Credit Notice Banner */}
            {debtAdditionAmount > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50/80 p-2.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <HandCoins className="size-3.5 text-amber-700" />
                  <span>Credit / Debt Notice</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Target Account:</span>
                    <span className={`font-semibold ${selectedCustomer ? "text-zinc-900" : "text-rose-600 font-bold"}`}>
                      {selectedCustomer ? selectedCustomer.name : "⚠️ Required (Select Customer)"}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-amber-800">Added to Debt:</span>
                    <span className="font-mono text-rose-600 tabular-nums">+{debtAdditionAmount.toLocaleString()} ETB</span>
                  </div>
                  {selectedCustomer && (
                    <div className="flex justify-between border-t border-amber-200 pt-1 text-xs font-bold text-rose-700">
                      <span>Projected Debt Balance:</span>
                      <span className="font-mono tabular-nums">{newProjectedDebt.toLocaleString()} ETB</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart Subtotal, Discount & Checkout Button */}
          <div className="mt-4 space-y-2.5 border-t border-zinc-100 pt-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-zinc-900 tabular-nums">{subtotal.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Discount</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={discountVal || ""}
                    onChange={(e) => setDiscountVal(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="h-6 w-16 rounded border border-zinc-200 bg-white px-1.5 text-right font-mono text-xs focus:border-[#5B4FE9] focus:outline-none"
                  />
                  <span>ETB</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between border-t border-zinc-100 pt-2">
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
              className={`flex h-11 w-full items-center justify-center gap-2 rounded-md text-xs font-bold tracking-tight shadow-2xs transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 ${
                debtAdditionAmount > 0
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-[#5B4FE9] text-white hover:bg-[#4D40D9]"
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
      </div>

      {/* Floating Bottom Cart Bar for Mobile/Tablet */}
      {cart.length > 0 && mobileTab === "catalog" && (
        <div className="sticky bottom-3 z-30 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3 text-white shadow-xl animate-in slide-in-from-bottom-2 lg:hidden">
          <div>
            <span className="text-[10px] text-slate-400">
              {cart.reduce((s, i) => s + i.quantity, 0)} items in cart
            </span>
            <div className="font-mono text-sm font-bold text-indigo-300">
              {total.toLocaleString()} ETB
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileTab("cart")}
            className="flex items-center gap-1.5 rounded-md bg-[#5B4FE9] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#4D40D9] active:scale-95"
          >
            <span>Review &amp; Pay</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      )}

      {/* Modals Container */}
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
