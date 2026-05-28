import { describe, it, expect } from "vitest";
import { calculatePricing } from "@/server/services/pricing.service";
import type { CartItem } from "@/shared/types/cart";

const item = (base: number, mods: number[] = [], qty = 1): CartItem => ({
  cartItemId: "c1",
  productId: "p1",
  name: "Test",
  basePriceInCents: base,
  modifiers: mods.map((p, i) => ({
    groupId: "g",
    optionId: `o${i}`,
    name: `Mod ${i}`,
    priceInCents: p,
  })),
  quantity: qty,
});

describe("calculatePricing", () => {
  it("computes subtotal, tax, fee and total", () => {
    const result = calculatePricing([item(1000)]);
    expect(result.subtotalInCents).toBe(1000);
    expect(result.taxInCents).toBe(80);
    expect(result.serviceFeeInCents).toBe(150);
    expect(result.totalInCents).toBe(1230);
  });

  it("adds modifier prices to subtotal", () => {
    const result = calculatePricing([item(1000, [100, 50])]);
    expect(result.subtotalInCents).toBe(1150);
  });

  it("multiplies by quantity", () => {
    const result = calculatePricing([item(500, [], 3)]);
    expect(result.subtotalInCents).toBe(1500);
  });

  it("rounds tax correctly", () => {
    const result = calculatePricing([item(333)]);
    expect(result.taxInCents).toBe(Math.round(333 * 0.08));
  });

  it("handles multiple items", () => {
    const result = calculatePricing([item(1000), item(500)]);
    expect(result.subtotalInCents).toBe(1500);
  });

  it("handles empty cart", () => {
    const result = calculatePricing([]);
    expect(result.subtotalInCents).toBe(0);
    expect(result.taxInCents).toBe(0);
    expect(result.totalInCents).toBe(150);
  });
});
