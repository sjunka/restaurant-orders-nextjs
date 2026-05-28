"use client";

import type { CartPricing } from "@/shared/types/cart";
import { formatCents } from "@/shared/utils/money";

interface Props {
  pricing: CartPricing;
}

export function PricingBreakdown({ pricing }: Props) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span>{formatCents(pricing.subtotalInCents)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Tax (8%)</span>
        <span>{formatCents(pricing.taxInCents)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Service fee</span>
        <span>{formatCents(pricing.serviceFeeInCents)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
        <span>Total</span>
        <span>{formatCents(pricing.totalInCents)}</span>
      </div>
    </div>
  );
}
