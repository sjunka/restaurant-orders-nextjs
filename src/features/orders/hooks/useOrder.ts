"use client";

import { useEffect, useState, useRef } from "react";
import type { Order } from "@/shared/types/order";

const TERMINAL_STATUSES = new Set(["DELIVERED", "FAILED"]);
const POLL_INTERVAL_MS = 3000;

interface UseOrderResult {
  order: Order | null;
  loading: boolean;
  error: string | null;
}

export function useOrder(orderId: string): UseOrderResult {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error("Failed to load order");
        const data = (await res.json()) as { order: Order };
        if (!cancelled) {
          setOrder(data.order);
          setLoading(false);
          if (!TERMINAL_STATUSES.has(data.order.status)) {
            timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load order");
          setLoading(false);
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [orderId]);

  return { order, loading, error };
}
