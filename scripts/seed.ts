/**
 * Seed script — populates the database with 7 menu items.
 * Run with: npm run seed
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import path from "path";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { ModifierGroup } from "../src/shared/types/product.js";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = path.resolve(dbUrl.replace("file:", ""));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbPath }) } as any);

// ── Shared modifier groups ──────────────────────────────────────────────────

const proteinGroup: ModifierGroup = {
  id: "grp-protein",
  name: "Protein",
  required: true,
  min: 1,
  max: 1,
  options: [
    { id: "opt-chicken", name: "Grilled Chicken", priceInCents: 0 },
    { id: "opt-beef",    name: "Seasoned Beef",   priceInCents: 150 },
    { id: "opt-tofu",   name: "Crispy Tofu",      priceInCents: 0 },
  ],
};

const toppingsGroup: ModifierGroup = {
  id: "grp-toppings",
  name: "Toppings",
  required: false,
  min: 0,
  max: 5,
  options: [
    { id: "opt-lettuce", name: "Shredded Lettuce",  priceInCents: 0 },
    { id: "opt-tomato",  name: "Tomato",             priceInCents: 0 },
    { id: "opt-onion",   name: "Caramelized Onion",  priceInCents: 75 },
    { id: "opt-avocado", name: "Avocado Slices",     priceInCents: 150 },
    { id: "opt-cheese",  name: "Cheddar Cheese",     priceInCents: 100 },
  ],
};

const saucesGroup: ModifierGroup = {
  id: "grp-sauces",
  name: "Sauces",
  required: false,
  min: 0,
  max: 3,
  options: [
    { id: "opt-chipotle", name: "Chipotle Mayo", priceInCents: 0 },
    { id: "opt-sriracha", name: "Sriracha",       priceInCents: 0 },
    { id: "opt-ranch",    name: "Ranch",           priceInCents: 0 },
    { id: "opt-bbq",      name: "BBQ",             priceInCents: 0 },
  ],
};

// ── Menu items ──────────────────────────────────────────────────────────────

const PRODUCTS = [
  // Fully customizable items
  {
    id: "prod-bowl",
    name: "Signature Bowl",
    description: "Build your perfect bowl",
    basePriceInCents: 1199,
    category: "Bowls",
    modifierGroups: [proteinGroup, toppingsGroup, saucesGroup],
  },
  {
    id: "prod-wrap",
    name: "Street Wrap",
    description: "Packed wrap with your choice of fillings",
    basePriceInCents: 999,
    category: "Wraps",
    modifierGroups: [proteinGroup, toppingsGroup, saucesGroup],
  },
  // Standard items (no customisation)
  {
    id: "prod-fries",
    name: "Crispy Fries",
    description: "Sea salt fries",
    basePriceInCents: 449,
    category: "Sides",
    modifierGroups: [],
  },
  {
    id: "prod-rings",
    name: "Onion Rings",
    description: "Beer battered",
    basePriceInCents: 549,
    category: "Sides",
    modifierGroups: [],
  },
  {
    id: "prod-cola",
    name: "Fountain Soda",
    description: "Pepsi, Coke, Sprite",
    basePriceInCents: 299,
    category: "Drinks",
    modifierGroups: [],
  },
  {
    id: "prod-water",
    name: "Sparkling Water",
    description: "500ml bottle",
    basePriceInCents: 199,
    category: "Drinks",
    modifierGroups: [],
  },
  {
    id: "prod-brownie",
    name: "Fudge Brownie",
    description: "Warm and gooey",
    basePriceInCents: 399,
    category: "Desserts",
    modifierGroups: [],
  },
];

// ── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  await db.product.deleteMany();

  for (const product of PRODUCTS) {
    await db.product.create({
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        basePriceInCents: product.basePriceInCents,
        category: product.category,
        modifierGroups: JSON.stringify(product.modifierGroups),
      },
    });
  }

  console.log(`Seeded ${PRODUCTS.length} products.`);
  await db.$disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
