"use client";

import { useCallback, useEffect, useState } from "react";
import type { TimelineEvent } from "@/shared/types/timeline";

interface UseTimelineResult {
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

interface TimelinePage {
  events: TimelineEvent[];
  nextCursor: string | null;
}

async function fetchTimelinePage(
  orderId: string,
  cursor?: string,
): Promise<TimelinePage> {
  const url = new URL(
    `/api/orders/${orderId}/timeline`,
    window.location.origin,
  );
  url.searchParams.set("pageSize", "20");
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load timeline");
  return (await res.json()) as TimelinePage;
}

export function useTimeline(orderId: string): UseTimelineResult {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTimelinePage(orderId)
      .then((data) => {
        if (cancelled) return;
        setEvents(data.events);
        setCursor(data.nextCursor);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load timeline");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const loadMore = useCallback(() => {
    if (!cursor) return;
    setLoading(true);
    fetchTimelinePage(orderId, cursor)
      .then((data) => {
        setEvents((prev) => [...prev, ...data.events]);
        setCursor(data.nextCursor);
      })
      .catch(() => setError("Failed to load timeline"))
      .finally(() => setLoading(false));
  }, [orderId, cursor]);

  return { events, loading, error, hasMore: cursor !== null, loadMore };
}
