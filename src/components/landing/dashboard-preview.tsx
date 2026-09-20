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

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.15);
  const total = subtotal + vat;

  function addItem(product: ProductItem) {
    setIsCompleted(false);
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
    <div className="relative mx-auto w-full max-w-[660px]">
      {/* Outer Device Frame (Modern Retail POS Terminal) */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c1017] shadow-[0_25px_70px_rgba(0,0,0,0.45)]">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#121824] px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-2 rounded-full bg-[#c0e763] animate-pulse" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <Store className="size-3.5 text-[#c0e763]" />
              <span>Andalus Mart • Bole Medhanealem</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <span className="hidden sm:inline-block rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
              REG #01
            </span>
            <span className="text-[#c0e763]">0.18s scan</span>
          </div>
        </div>

        {/* Terminal Content Split */}
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left: Quick Tap Catalog (7 cols) */}
          <div className="border-b border-zinc-800 p-4 md:col-span-7 md:border-b-0 md:border-r">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Tap to Ring Up Item
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Touch / Barcode Ready</span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
              {SAMPLE_PRODUCTS.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    type="button"
                    className="group relative flex flex-col justify-between rounded-xl border border-zinc-800/90 bg-[#141b27] p-2.5 text-left transition hover:border-[#c0e763]/60 hover:bg-[#1a2333] active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500">{product.sku}</span>
                        {inCart && (
                          <span className="rounded bg-[#c0e763] px-1.5 py-0.2 text-[10px] font-bold text-zinc-950">
                            {inCart.quantity}x
                          </span>
                        )}
                      </div>
                      <div className="mt-1 line-clamp-1 text-xs font-semibold text-zinc-200 group-hover:text-white">
                        {product.name}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between pt-1">
                      <span className="text-xs font-bold font-mono text-[#c0e763]">
                        {product.price} <span className="text-[9px] font-normal text-zinc-400">ETB</span>
                      </span>
                      <span className="text-[10px] text-zinc-500">{product.stock} in stock</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Metrics Strip */}
            <div className="mt-4 flex items-center justify-between rounded-lg border border-zinc-800/80 bg-[#0e141f] p-2 text-[11px] text-zinc-400">
              <span>Today&apos;s Total Sales</span>
              <span className="font-mono font-bold text-zinc-100">ETB 42,850.00</span>
              <span className="rounded bg-[#c0e763]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#c0e763]">
                +18.4%
              </span>
            </div>
          </div>

          {/* Right: Active Ticket & Payment (5 cols) */}
          <div className="flex flex-col justify-between bg-[#0e1420] p-4 md:col-span-5">
            <div>
              <div className="mb-2 flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                  <ShoppingCart className="size-3.5 text-[#c0e763]" />
                  <span>Current Cart ({cart.reduce((a, c) => a + c.quantity, 0)})</span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    type="button"
                    className="text-[10px] text-zinc-500 hover:text-red-400"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Cart List */}
              <div className="max-h-[160px] space-y-2 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    Cart empty. Tap products to add.
                  </div>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg bg-[#141b27] px-2 py-1.5 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-zinc-200">{product.name}</div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {product.price} ETB x {quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          type="button"
                          className="flex size-5 items-center justify-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-4 text-center font-mono font-bold text-white text-xs">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          type="button"
                          className="flex size-5 items-center justify-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Rail Selectors */}
              <div className="mt-3 border-t border-zinc-800 pt-2.5">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Payment Method
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("telebirr")}
                    className={`flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition ${
                      paymentMethod === "telebirr"
                        ? "bg-[#c0e763] text-zinc-950 shadow-xs"
                        : "bg-[#161f2e] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Smartphone className="size-3 shrink-0" />
                    <span className="truncate">Telebirr</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cbe")}
                    className={`flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition ${
                      paymentMethod === "cbe"
                        ? "bg-[#c0e763] text-zinc-950 shadow-xs"
                        : "bg-[#161f2e] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <CreditCard className="size-3 shrink-0" />
                    <span className="truncate">CBE Birr</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition ${
                      paymentMethod === "cash"
                        ? "bg-[#c0e763] text-zinc-950 shadow-xs"
                        : "bg-[#161f2e] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>Cash</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Total & Checkout Button */}
            <div className="mt-3 border-t border-zinc-800 pt-2.5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono text-zinc-300">{subtotal} ETB</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>VAT (15%)</span>
                <span className="font-mono text-zinc-300">{vat} ETB</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-zinc-800/80 pt-1 text-sm font-bold">
                <span className="text-white">Grand Total</span>
                <span className="font-mono text-base text-[#c0e763]">{total} ETB</span>
              </div>

              {isCompleted ? (
                <div className="mt-2.5 rounded-lg border border-[#c0e763]/40 bg-[#c0e763]/10 p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#c0e763]">
                    <CheckCircle2 className="size-4" />
                    <span>Sale Completed & Receipt Printed!</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-zinc-400">
                    Paid via {paymentMethod.toUpperCase()} • Instant Sync
                  </div>
                  <button
                    onClick={handleReset}
                    type="button"
                    className="mt-2 text-xs font-semibold text-zinc-300 underline hover:text-white"
                  >
                    Next Customer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#c0e763] text-xs font-bold text-zinc-950 shadow-xs transition hover:bg-[#b0d952] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Printer className="size-3.5" />
                  <span>Complete Sale & Print (F12)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Thermal Receipt Footer Strip */}
        <div className="border-t border-zinc-800 bg-[#090d14] px-4 py-2 font-mono text-[11px] text-zinc-500">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="size-1.5 rounded-full bg-[#c0e763]" />
              THERMAL ROLL: 80MM OK
            </span>
            <span>ANDALUS OS v2.4 • ETH-ADDIS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

