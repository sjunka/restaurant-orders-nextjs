"use client";

import Link from "next/link";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { TimelineList } from "@/features/timeline/components/TimelineList";
import { formatCents } from "@/shared/utils/money";

interface Props {
  orderId: string;
}

export function OrderView({ orderId }: Props) {
  const { order, loading, error } = useOrder(orderId);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">{error ?? "Order not found"}</p>
        <Link href="/menu" className="text-orange-500 text-sm mt-4 inline-block">
          Back to menu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Status</h1>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            #{order.orderId.slice(0, 8)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} large />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-700">Order Summary</h2>
        {order.items.map((item) => (
          <div key={item.cartItemId} className="flex justify-between text-sm">
            <div>
              <span className="text-gray-800">
                {item.quantity}x {item.name}
              </span>
              {item.modifiers.length > 0 && (
                <p className="text-gray-400 text-xs mt-0.5">
                  {item.modifiers.map((m) => m.name).join(", ")}
                </p>
              )}
            </div>
            <span className="text-gray-700 font-medium">
              {formatCents(
                (item.basePriceInCents +
                  item.modifiers.reduce((s, m) => s + m.priceInCents, 0)) *
                  item.quantity,
              )}
            </span>
          </div>
        ))}
        <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span>{formatCents(order.pricing.totalInCents)}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Event Timeline</h2>
        <TimelineList orderId={orderId} />
      </div>

      <Link
        href="/menu"
        className="block text-center text-sm text-gray-400 hover:text-gray-600"
      >
        Back to menu
      </Link>
    </div>
  );
}
