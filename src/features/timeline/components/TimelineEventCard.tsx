"use client";

import { useState } from "react";
import type { TimelineEvent } from "@/shared/types/timeline";

const EVENT_COLORS: Record<string, string> = {
  CART_ITEM_ADDED: "bg-blue-50 border-blue-200 text-blue-700",
  CART_ITEM_UPDATED: "bg-indigo-50 border-indigo-200 text-indigo-700",
  CART_ITEM_REMOVED: "bg-gray-50 border-gray-200 text-gray-700",
  PRICING_CALCULATED: "bg-yellow-50 border-yellow-200 text-yellow-700",
  ORDER_PLACED: "bg-orange-50 border-orange-200 text-orange-700",
  ORDER_STATUS_CHANGED: "bg-green-50 border-green-200 text-green-700",
  VALIDATION_FAILED: "bg-red-50 border-red-200 text-red-700",
};

interface Props {
  event: TimelineEvent;
}

export function TimelineEventCard({ event }: Props) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = EVENT_COLORS[event.type] ?? "bg-gray-50 border-gray-200 text-gray-700";
  const time = new Date(event.timestamp).toLocaleTimeString();

  return (
    <div className={`border rounded-xl p-3 ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full border ${colorClass}`}>
            {event.type}
          </span>
          <span className="text-xs text-gray-500 shrink-0">{time}</span>
          <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">
            via {event.source}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
        >
          {expanded ? "Hide" : "Details"}
        </button>
      </div>
      {expanded && (
        <pre className="mt-2 text-xs text-gray-700 bg-white/70 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      )}
    </div>
  );
}
