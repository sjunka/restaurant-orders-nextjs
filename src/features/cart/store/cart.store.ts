"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/shared/types/cart";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface CartStore {
  items: CartItem[];
  correlationId: string;
  addItem: (item: Omit<CartItem, "cartItemId">) => void;
  updateItem: (cartItemId: string, patch: Partial<Omit<CartItem, "cartItemId">>) => void;
  removeItem: (cartItemId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      correlationId: uuid(),

      addItem: (item) =>
        set((s) => ({
          items: [...s.items, { ...item, cartItemId: uuid() }],
        })),

      updateItem: (cartItemId, patch) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.cartItemId === cartItemId ? { ...i, ...patch } : i,
          ),
        })),

      removeItem: (cartItemId) =>
        set((s) => ({
          items: s.items.filter((i) => i.cartItemId !== cartItemId),
        })),

      clear: () => set({ items: [], correlationId: uuid() }),
    }),
    { name: "cart-store" },
  ),
);
