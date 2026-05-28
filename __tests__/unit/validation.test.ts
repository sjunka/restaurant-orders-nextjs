import { describe, it, expect } from "vitest";
import { validateOrderItems } from "@/server/services/validation.service";
import type { CartItem } from "@/shared/types/cart";
import type { Product } from "@/shared/types/product";

const product: Product = {
  id: "prod-bowl",
  name: "Signature Bowl",
  description: "Bowl",
  basePriceInCents: 1199,
  category: "Bowls",
  modifierGroups: [
    {
      id: "grp-protein",
      name: "Protein",
      required: true,
      min: 1,
      max: 1,
      options: [{ id: "opt-chicken", name: "Grilled Chicken", priceInCents: 0 }],
    },
    {
      id: "grp-toppings",
      name: "Toppings",
      required: false,
      min: 0,
      max: 5,
      options: [{ id: "opt-lettuce", name: "Lettuce", priceInCents: 0 }],
    },
  ],
};

const itemWithProtein: CartItem = {
  cartItemId: "c1",
  productId: "prod-bowl",
  name: "Signature Bowl",
  basePriceInCents: 1199,
  modifiers: [{ groupId: "grp-protein", optionId: "opt-chicken", name: "Grilled Chicken", priceInCents: 0 }],
  quantity: 1,
};

const itemWithoutProtein: CartItem = {
  cartItemId: "c2",
  productId: "prod-bowl",
  name: "Signature Bowl",
  basePriceInCents: 1199,
  modifiers: [],
  quantity: 1,
};

describe("validateOrderItems", () => {
  it("passes when required groups are satisfied", () => {
    const errors = validateOrderItems([itemWithProtein], [product]);
    expect(errors).toHaveLength(0);
  });

  it("fails when required group is missing", () => {
    const errors = validateOrderItems([itemWithoutProtein], [product]);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toContain("grp-protein");
  });

  it("fails when product does not exist", () => {
    const item: CartItem = { ...itemWithProtein, productId: "unknown" };
    const errors = validateOrderItems([item], [product]);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("does not fail for optional groups with no selection", () => {
    const errors = validateOrderItems([itemWithProtein], [product]);
    expect(errors).toHaveLength(0);
  });
});
