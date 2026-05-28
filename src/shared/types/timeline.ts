export type EventType =
  | "CART_ITEM_ADDED"
  | "CART_ITEM_UPDATED"
  | "CART_ITEM_REMOVED"
  | "PRICING_CALCULATED"
  | "ORDER_PLACED"
  | "ORDER_STATUS_CHANGED"
  | "VALIDATION_FAILED";

export type EventSource = "web" | "api" | "worker";

export interface TimelineEvent {
  eventId: string;
  timestamp: string;
  orderId: string | null;
  userId: string;
  type: EventType;
  source: EventSource;
  correlationId: string;
  payload: Record<string, unknown>;
}
