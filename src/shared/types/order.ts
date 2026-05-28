import type { CartItem, CartPricing } from "./cart";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERED"
  | "FAILED";

export interface Order {
  orderId: string;
  userId: string;
  items: CartItem[];
  pricing: CartPricing;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
