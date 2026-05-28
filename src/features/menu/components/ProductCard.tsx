"use client";

import { useState } from "react";
import type { Product } from "@/shared/types/product";
import type { SelectedModifier } from "@/shared/types/cart";
import { useCartStore } from "@/features/cart/store/cart.store";
import { ModifierModal } from "./ModifierModal";
import { formatCents } from "@/shared/utils/money";

const MOCK_USER_ID = process.env.NEXT_PUBLIC_MOCK_USER_ID ?? "user-mock-001";

const CATEGORY_COLORS: Record<string, string> = {
  Bowls: "bg-green-100 text-green-700",
  Wraps: "bg-blue-100 text-blue-700",
  Sides: "bg-yellow-100 text-yellow-700",
  Drinks: "bg-cyan-100 text-cyan-700",
  Desserts: "bg-pink-100 text-pink-700",
};

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem, correlationId } = useCartStore();

  function handleAdd(modifiers: SelectedModifier[] = []) {
    addItem({
      productId: product.id,
      name: product.name,
      basePriceInCents: product.basePriceInCents,
      modifiers,
      quantity: 1,
    });

    fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-Id": correlationId,
        "X-User-Id": MOCK_USER_ID,
      },
      body: JSON.stringify({
        type: "CART_ITEM_ADDED",
        source: "web",
        payload: { productId: product.id, name: product.name, modifiers },
      }),
    }).catch(() => null);

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    setShowModal(false);
  }

  const colorClass = CATEGORY_COLORS[product.category] ?? "bg-gray-100 text-gray-600";

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
              {product.category}
            </span>
            <h3 className="font-bold text-gray-900 mt-2">{product.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{product.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-gray-900 text-lg">
            {formatCents(product.basePriceInCents)}
          </span>
          <button
            type="button"
            onClick={() =>
              product.modifierGroups.length > 0
                ? setShowModal(true)
                : handleAdd()
            }
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              added
                ? "bg-green-500 text-white"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            {added ? "Added ✓" : product.modifierGroups.length > 0 ? "Customize" : "Add to Cart"}
          </button>
        </div>
      </div>

      {showModal && (
        <ModifierModal
          product={product}
          onConfirm={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
