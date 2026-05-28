"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/shared/types/product";

interface UseMenuResult {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export function useMenu(): UseMenuResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data: { products: Product[] }) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load menu");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, error };
}
