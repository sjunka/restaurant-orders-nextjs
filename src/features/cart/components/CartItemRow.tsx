"use client";

import { useState } from "react";
import type { CartItem } from "@/shared/types/cart";
import type { Product } from "@/shared/types/product";
import { useCartStore } from "@/features/cart/store/cart.store";
import { ModifierModal } from "@/features/menu/components/ModifierModal";
import { formatCents } from "@/shared/utils/money";

const MOCK_USER_ID = process.env.NEXT_PUBLIC_MOCK_USER_ID ?? "user-mock-001";

interface Props {
  item: CartItem;
  product: Product | undefined;
}

export function CartItemRow({ item, product }: Props) {
  const [editing, setEditing] = useState(false);
  const { removeItem, updateItem, correlationId } = useCartStore();

  const lineTotal =
    (item.basePriceInCents +
      item.modifiers.reduce((s, m) => s + m.priceInCents, 0)) *
    item.quantity;

  function handleRemove() {
    removeItem(item.cartItemId);
    fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-Id": correlationId,
        "X-User-Id": MOCK_USER_ID,
      },
      body: JSON.stringify({
        type: "CART_ITEM_REMOVED",
        source: "web",
        payload: { cartItemId: item.cartItemId, productId: item.productId },
      }),
    }).catch(() => null);
  }

  function handleEdit(modifiers: typeof item.modifiers) {
    updateItem(item.cartItemId, { modifiers });
    fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-Id": correlationId,
        "X-User-Id": MOCK_USER_ID,
      },
      body: JSON.stringify({
        type: "CART_ITEM_UPDATED",
        source: "web",
        payload: { cartItemId: item.cartItemId, modifiers },
      }),
    }).catch(() => null);
    setEditing(false);
  }

  return (
    <>
      <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            <span className="font-bold text-gray-900 ml-4">{formatCents(lineTotal)}</span>
          </div>
          {item.modifiers.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {item.modifiers.map((m) => m.name).join(", ")}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  item.quantity > 1
                    ? updateItem(item.cartItemId, { quantity: item.quantity - 1 })
                    : handleRemove()
                }
                className="size-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateItem(item.cartItemId, { quantity: item.quantity + 1 })}
                className="size-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            {product && product.modifierGroups.length > 0 && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-red-400 hover:text-red-500 font-medium ml-auto"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {editing && product && (
        <ModifierModal
          product={product}
          onConfirm={handleEdit}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
