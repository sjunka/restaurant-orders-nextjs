import type { CartItem } from "@/shared/types/cart";
import type { Product } from "@/shared/types/product";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateOrderItems(
  items: CartItem[],
  products: Product[],
): ValidationError[] {
  const errors: ValidationError[] = [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      errors.push({ field: item.productId, message: "Product not found" });
      continue;
    }

    for (const group of product.modifierGroups) {
      if (!group.required) continue;
      const selected = item.modifiers.filter((m) => m.groupId === group.id);
      if (selected.length < group.min) {
        errors.push({
          field: `${item.cartItemId}.${group.id}`,
          message: `Modifier group "${group.name}" requires at least ${group.min} selection(s)`,
        });
      }
    }
  }

  return errors;
}
