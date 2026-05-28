import { db } from "@/server/db/client";
import type { Order, OrderStatus } from "@/shared/types/order";
import type { CartItem, CartPricing, SelectedModifier } from "@/shared/types/cart";

interface CreateOrderInput {
  orderId: string;
  userId: string;
  correlationId: string;
  items: CartItem[];
  pricing: CartPricing;
  status: OrderStatus;
  idempotencyKey?: string;
}

export const OrderRepo = {
  async create(input: CreateOrderInput): Promise<void> {
    await db.order.create({
      data: {
        id: input.orderId,
        userId: input.userId,
        correlationId: input.correlationId,
        status: input.status,
        subtotalCents: input.pricing.subtotalInCents,
        taxCents: input.pricing.taxInCents,
        serviceFeeCents: input.pricing.serviceFeeInCents,
        totalCents: input.pricing.totalInCents,
        idempotencyKey: input.idempotencyKey,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            basePriceInCents: item.basePriceInCents,
            modifiers: JSON.stringify(item.modifiers),
            quantity: item.quantity,
          })),
        },
      },
    });
  },

  async findById(orderId: string): Promise<Order | null> {
    const row = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!row) return null;

    const pricing: CartPricing = {
      subtotalInCents: row.subtotalCents,
      taxInCents: row.taxCents,
      serviceFeeInCents: row.serviceFeeCents,
      totalInCents: row.totalCents,
    };

    const items: CartItem[] = row.items.map((item) => ({
      cartItemId: item.id,
      productId: item.productId,
      name: item.name,
      basePriceInCents: item.basePriceInCents,
      modifiers: JSON.parse(item.modifiers) as SelectedModifier[],
      quantity: item.quantity,
    }));

    return {
      orderId: row.id,
      userId: row.userId,
      items,
      pricing,
      status: row.status as OrderStatus,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    await db.order.update({
      where: { id: orderId },
      data: { status },
    });
  },
};
