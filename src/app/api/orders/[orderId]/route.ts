import { NextRequest, NextResponse } from "next/server";
import { OrderRepo } from "@/server/repositories/order.repo";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/orders/[orderId]">,
) {
  const { orderId } = await ctx.params;
  const order = await OrderRepo.findById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}
