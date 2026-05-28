export interface SelectedModifier {
  groupId: string;
  optionId: string;
  name: string;
  priceInCents: number;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  basePriceInCents: number;
  modifiers: SelectedModifier[];
  quantity: number;
}

export interface CartPricing {
  subtotalInCents: number;
  taxInCents: number;
  serviceFeeInCents: number;
  totalInCents: number;
}
