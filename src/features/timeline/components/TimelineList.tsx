"use client";

import { useTimeline } from "@/features/timeline/hooks/useTimeline";
import { TimelineEventCard } from "./TimelineEventCard";

interface Props {
  orderId: string;
}

export function TimelineList({ orderId }: Props) {
  const { events, loading, error, hasMore, loadMore } = useTimeline(orderId);

  if (loading && events.length === 0) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  if (events.length === 0) {
    return <p className="text-gray-400 text-sm">No events yet.</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <TimelineEventCard key={event.eventId} event={event} />
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="w-full py-2 text-sm text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
