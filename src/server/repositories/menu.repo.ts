import { db } from "@/server/db/client";
import type { Product, ModifierGroup } from "@/shared/types/product";

export const MenuRepo = {
  async getAll(): Promise<Product[]> {
    const rows = await db.product.findMany({ orderBy: { category: "asc" } });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      basePriceInCents: row.basePriceInCents,
      category: row.category,
      imageUrl: row.imageUrl ?? undefined,
      modifierGroups: JSON.parse(row.modifierGroups) as ModifierGroup[],
    }));
  },
};
