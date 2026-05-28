import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod/v4";
import { calculatePricing } from "@/server/services/pricing.service";
import { withIdempotency } from "@/server/services/idempotency.service";
import { simulateOrderProcessing } from "@/server/services/order.service";
import { validateOrderItems } from "@/server/services/validation.service";
import { OrderRepo } from "@/server/repositories/order.repo";
import { MenuRepo } from "@/server/repositories/menu.repo";
import { emitEvent } from "@/server/events/emit";

const SelectedModifierSchema = z.object({
  groupId: z.string(),
  optionId: z.string(),
  name: z.string(),
  priceInCents: z.number().int().nonnegative(),
});

const CartItemSchema = z.object({
  cartItemId: z.string(),
  productId: z.string(),
  name: z.string(),
  basePriceInCents: z.number().int().nonnegative(),
  modifiers: z.array(SelectedModifierSchema),
  quantity: z.number().int().positive(),
});

const OrderBodySchema = z.object({
  userId: z.string(),
  items: z.array(CartItemSchema).min(1),
  correlationId: z.string(),
});

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency-Key header required" },
      { status: 400 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = OrderBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_FAILED", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { userId, items, correlationId } = parsed.data;

  const products = await MenuRepo.getAll();
  const validationErrors = validateOrderItems(items, products);

  if (validationErrors.length > 0) {
    await emitEvent({
      orderId: null,
      userId,
      type: "VALIDATION_FAILED",
      source: "api",
      correlationId,
      payload: { errors: validationErrors },
    });
    return NextResponse.json(
      { error: "VALIDATION_FAILED", issues: validationErrors },
      { status: 400 },
    );
  }

  const { result } = await withIdempotency(idempotencyKey, async () => {
    const orderId = randomUUID();
    const pricing = calculatePricing(items);

    await OrderRepo.create({ orderId, userId, correlationId, items, pricing, status: "PENDING", idempotencyKey });

    await Promise.all([
      emitEvent({
        orderId,
        userId,
        type: "ORDER_PLACED",
        source: "api",
        correlationId,
        payload: { items, pricing },
      }),
      emitEvent({
        orderId,
        userId,
        type: "PRICING_CALCULATED",
        source: "api",
        correlationId,
        payload: pricing as unknown as Record<string, unknown>,
      }),
    ]);

    simulateOrderProcessing(orderId, userId, correlationId);

    return { orderId };
  });

  return NextResponse.json(result, { status: 202 });
}
