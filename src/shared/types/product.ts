export interface ModifierOption {
  id: string;
  name: string;
  priceInCents: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePriceInCents: number;
  category: string;
  imageUrl?: string;
  modifierGroups: ModifierGroup[];
}
