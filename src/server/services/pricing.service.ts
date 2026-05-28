import type { CartItem, CartPricing } from "@/shared/types/cart";

const TAX_RATE = Number(process.env.TAX_RATE ?? 0.08);
const SERVICE_FEE_CENTS = Number(process.env.SERVICE_FEE_CENTS ?? 150);

export function calculatePricing(items: CartItem[]): CartPricing {
  const subtotalInCents = items.reduce((sum, item) => {
    const modTotal = item.modifiers.reduce((m, mod) => m + mod.priceInCents, 0);
    return sum + (item.basePriceInCents + modTotal) * item.quantity;
  }, 0);

  const taxInCents = Math.round(subtotalInCents * TAX_RATE);
  const serviceFeeInCents = SERVICE_FEE_CENTS;
  const totalInCents = subtotalInCents + taxInCents + serviceFeeInCents;

  return { subtotalInCents, taxInCents, serviceFeeInCents, totalInCents };
}
