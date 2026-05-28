"use client";

import React from "react";
import type { Product } from "@/shared/types/product";
import { ProductCard } from "./ProductCard";

interface Props {
  products: Product[];
}

export function MenuGrid({ products }: Props) {
  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Menu</h1>
      {categories.map((cat) => (
        <div key={cat} className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
            {cat}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.reduce<React.ReactNode[]>((acc, product) => {
              if (product.category === cat) {
                acc.push(<ProductCard key={product.id} product={product} />);
              }
              return acc;
            }, [])}
          </div>
        </div>
      ))}
    </div>
  );
}
