import type { Metadata } from "next";
import { MenuRepo } from "@/server/repositories/menu.repo";
import { MenuGrid } from "@/features/menu/components/MenuGrid";

export const metadata: Metadata = {
  title: "Menu | Eats",
  description: "Browse our full menu and customize your order",
};

export default async function MenuPage() {
  const products = await MenuRepo.getAll();
  return <MenuGrid products={products} />;
}
