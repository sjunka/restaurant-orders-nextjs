"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/features/cart/store/cart.store";
import { useCartPricing } from "@/features/cart/hooks/useCartPricing";
import { CartItemRow } from "./CartItemRow";
import { PricingBreakdown } from "./PricingBreakdown";
import { useMenu } from "@/features/menu/hooks/useMenu";

const MOCK_USER_ID = process.env.NEXT_PUBLIC_MOCK_USER_ID ?? "user-mock-001";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function CartView() {
  const { push } = useRouter();
  const { items, correlationId, clear } = useCartStore();
  const pricing = useCartPricing();
  const { products } = useMenu();
  const [checkingOut, setCheckingOut] = useState(false);
  const [toast, setToast] = useState<{ type: "error"; msg: string } | null>(null);

  async function handleCheckout() {
    if (items.length === 0 || checkingOut) return;
    setCheckingOut(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": uuid(),
        },
        body: JSON.stringify({ userId: MOCK_USER_ID, items, correlationId }),
      });

      const data = (await res.json()) as { orderId?: string; error?: string };

      if (!res.ok || !data.orderId) {
        setToast({ type: "error", msg: data.error ?? "Checkout failed" });
        return;
      }

      clear();
      push(`/orders/${data.orderId}`);
    } catch {
      setToast({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🛒</p>
        <h2 className="text-xl font-semibold text-gray-700">Your cart is empty</h2>
        <p className="text-gray-400 mt-2 mb-6">Add some items from the menu</p>
        <Link
          href="/menu"
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

      {toast && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
          <span>⚠</span>
          <span>{toast.msg}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-auto text-red-400" aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <CartItemRow
            key={item.cartItemId}
            item={item}
            product={products.find((p) => p.id === item.productId)}
          />
        ))}
      </div>

      <PricingBreakdown pricing={pricing} />

      <button
        type="button"
        onClick={handleCheckout}
        disabled={checkingOut}
        className="w-full mt-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-xl transition-colors text-lg"
      >
        {checkingOut ? "Placing order..." : "Place Order"}
      </button>

      <Link
        href="/menu"
        className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-4"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
