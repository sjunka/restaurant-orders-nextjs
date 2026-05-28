"use client";

import Link from "next/link";
import { useCartStore } from "@/features/cart/store/cart.store";

export function NavBar() {
  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  );

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto max-w-4xl px-4 h-14 flex items-center justify-between">
        <Link href="/menu" className="font-bold text-orange-500 text-lg">
          🍽 Eats
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/menu"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Menu
          </Link>
          <Link
            href="/cart"
            className="relative text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-3.5 bg-orange-500 text-white text-xs flex items-center justify-center rounded-full min-w-4.5 px-1">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
