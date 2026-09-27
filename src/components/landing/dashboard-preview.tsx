"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  Printer,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
} from "lucide-react";

type ProductItem = {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  stock: number;
};

const SAMPLE_PRODUCTS: ProductItem[] = [
  { id: "1", name: "Fresh Milk 1L", sku: "MLK-01", price: 110, category: "Dairy", stock: 18 },
  { id: "2", name: "Yes Spring Water 1L", sku: "H2O-04", price: 35, category: "Beverages", stock: 45 },
  { id: "3", name: "Tomoca Roast 250g", sku: "COF-12", price: 380, category: "Coffee", stock: 8 },
  { id: "4", name: "Sunflower Oil 1L", sku: "OIL-08", price: 260, category: "Cooking", stock: 12 },
  { id: "5", name: "Habesha Cold Beer", sku: "BEER-02", price: 55, category: "Beverages", stock: 32 },
  { id: "6", name: "Fresh Ambasha Bread", sku: "BRD-01", price: 50, category: "Bakery", stock: 15 },
];

export function DashboardPreview() {
  const [cart, setCart] = useState<Array<{ product: ProductItem; quantity: number }>>([
    { product: SAMPLE_PRODUCTS[0], quantity: 2 },
    { product: SAMPLE_PRODUCTS[1], quantity: 3 },
    { product: SAMPLE_PRODUCTS[2], quantity: 1 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<"telebirr" | "cbe" | "cash">("telebirr");
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.15);
  const total = subtotal + vat;

  function addItem(product: ProductItem) {
    setIsCompleted(false);
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 300);

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(id: string, delta: number) {
    setIsCompleted(false);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as Array<{ product: ProductItem; quantity: number }>,
    );
  }

  function handleCheckout() {
    if (cart.length === 0) return;
    setIsCompleted(true);
  }

  function handleReset() {
    setIsCompleted(false);
    setCart([
      { product: SAMPLE_PRODUCTS[0], quantity: 1 },
      { product: SAMPLE_PRODUCTS[1], quantity: 2 },
    ]);
  }

  return (
    <div className="relative mx-auto w-full max-w-full">
      {/* Outer Device Frame (Modern Retail POS Terminal) */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-[#090D14] text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-neutral-700/80">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800/90 bg-[#0D121B] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5B4FE9] opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[#5B4FE9]" />
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-200">
              <Store className="size-3.5 text-[#5B4FE9]" />
              <span>Andalus Counter • Bole Branch</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
            <span className="hidden rounded bg-neutral-800/80 px-2 py-0.5 text-neutral-300 sm:inline-block">
              REG #01
            </span>
            <span className="text-[#5B4FE9] font-medium flex items-center gap-1">
              <Sparkles className="size-3" /> 0.18s latency
            </span>
          </div>
        </div>

        {/* Terminal Content Split */}
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left: Quick Catalog (7 cols) */}
          <div className="border-b border-neutral-800 p-4 md:col-span-7 md:border-b-0 md:border-r">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-neutral-400">
                QUICK-RING CATALOG
              </span>
              <span className="font-mono text-[10px] text-neutral-500">Tap to Scan &amp; Add</span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
              {SAMPLE_PRODUCTS.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const isJustAdded = lastAddedId === product.id;
                return (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    type="button"
                    className={`group relative flex flex-col justify-between rounded-lg border p-2.5 text-left transition-all duration-150 active:scale-[0.97] ${
                      isJustAdded
                        ? "border-[#5B4FE9] bg-[#5B4FE9]/15"
                        : "border-neutral-800/80 bg-[#111722] hover:border-[#5B4FE9]/50 hover:bg-[#161e2c]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-neutral-500">{product.sku}</span>
                        {inCart && (
                          <span className="rounded bg-[#5B4FE9] px-1.5 py-0.2 font-mono text-[10px] font-bold text-white animate-in zoom-in-75 duration-150">
                            {inCart.quantity}x
                          </span>
                        )}
                      </div>
                      <div className="mt-1 line-clamp-1 text-xs font-medium text-neutral-200 group-hover:text-white">
                        {product.name}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between pt-1">
                      <span className="font-mono text-xs font-bold text-white">
                        {product.price} <span className="text-[9px] font-normal text-neutral-400">ETB</span>
                      </span>
                      <span className="text-[10px] text-neutral-500">{product.stock} pcs</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Metrics Strip */}
            <div className="mt-4 flex items-center justify-between rounded-md border border-neutral-800/80 bg-[#0B0F15] p-2.5 text-[11px] text-neutral-400">
              <span>Shift Register Sales</span>
              <span className="font-mono font-semibold text-white">ETB 42,850.00</span>
              <span className="rounded bg-[#5B4FE9]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#5B4FE9]">
                RECONCILED
              </span>
            </div>
          </div>

          {/* Right: Active Ticket & Payment (5 cols) */}
          <div className="flex flex-col justify-between bg-[#0B0F16] p-4 md:col-span-5">
            <div>
              <div className="mb-2 flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
                  <ShoppingCart className="size-3.5 text-[#5B4FE9]" />
                  <span>Current Bill ({cart.reduce((a, c) => a + c.quantity, 0)})</span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    type="button"
                    className="text-[10px] text-neutral-500 transition-colors hover:text-red-400"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="max-h-[160px] space-y-1.5 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500">
                    Cart empty. Tap products to add.
                  </div>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-md bg-[#121824] px-2.5 py-1.5 text-xs transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-neutral-200">{product.name}</div>
                        <div className="font-mono text-[10px] text-neutral-500">
                          {product.price} ETB × {quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          type="button"
                          className="flex size-5 items-center justify-center rounded bg-neutral-800 text-neutral-300 transition-all hover:bg-neutral-700 active:scale-90"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-4 text-center font-mono text-xs font-bold text-white">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          type="button"
                          className="flex size-5 items-center justify-center rounded bg-neutral-800 text-neutral-300 transition-all hover:bg-neutral-700 active:scale-90"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Rail Selectors */}
              <div className="mt-3 border-t border-neutral-800 pt-2.5">
                <span className="mb-1.5 block text-[10px] font-semibold tracking-wider text-neutral-400">
                  PAYMENT TENDER
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("telebirr")}
                    className={`flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-all duration-150 active:scale-95 ${
                      paymentMethod === "telebirr"
                        ? "bg-[#5B4FE9] text-white shadow-sm shadow-[#5B4FE9]/30"
                        : "bg-[#141b26] text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Smartphone className="size-3 shrink-0" />
                    <span className="truncate">Telebirr</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cbe")}
                    className={`flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-all duration-150 active:scale-95 ${
                      paymentMethod === "cbe"
                        ? "bg-[#5B4FE9] text-white shadow-sm shadow-[#5B4FE9]/30"
                        : "bg-[#141b26] text-neutral-400 hover:text-white"
                    }`}
                  >
                    <CreditCard className="size-3 shrink-0" />
                    <span className="truncate">CBE Birr</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-all duration-150 active:scale-95 ${
                      paymentMethod === "cash"
                        ? "bg-[#5B4FE9] text-white shadow-sm shadow-[#5B4FE9]/30"
                        : "bg-[#141b26] text-neutral-400 hover:text-white"
                    }`}
                  >
                    <span>Cash</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Total & Checkout */}
            <div className="mt-3 border-t border-neutral-800 pt-2.5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Subtotal</span>
                <span className="font-mono text-neutral-300">{subtotal} ETB</span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Tax (15%)</span>
                <span className="font-mono text-neutral-300">{vat} ETB</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-neutral-800/80 pt-1 text-sm font-bold">
                <span className="text-white">Total</span>
                <span className="font-mono text-base text-[#5B4FE9]">{total} ETB</span>
              </div>

              {isCompleted ? (
                <div className="mt-2.5 rounded-lg border border-[#5B4FE9]/40 bg-[#5B4FE9]/10 p-2.5 text-center animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#5B4FE9]">
                    <CheckCircle2 className="size-4 animate-in spin-in-90 duration-300" />
                    <span>Transaction Recorded & Receipt Printed</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-neutral-400">
                    Paid via {paymentMethod.toUpperCase()} • Synced to Cloud
                  </div>
                  <button
                    onClick={handleReset}
                    type="button"
                    className="mt-2 text-xs font-medium text-neutral-300 underline transition hover:text-white"
                  >
                    Next Customer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="mt-2.5 flex h-9.5 w-full items-center justify-center gap-2 rounded-lg bg-[#5B4FE9] text-xs font-semibold text-white shadow-md shadow-[#5B4FE9]/25 transition-all hover:bg-[#4d42c7] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Printer className="size-3.5" />
                  <span>Process Checkout (F12)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Thermal Receipt Footer Strip */}
        <div className="border-t border-neutral-800 bg-[#070A0F] px-4 py-2 font-mono text-[11px] text-neutral-500">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              THERMAL PRINTER: 80MM READY
            </span>
            <span>ANDALUS OS · ETH-ADDIS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
