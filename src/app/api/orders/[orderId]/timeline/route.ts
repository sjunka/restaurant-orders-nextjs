import { NextRequest, NextResponse } from "next/server";
import { TimelineRepo } from "@/server/repositories/timeline.repo";

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/orders/[orderId]/timeline">,
) {
  const { orderId } = await ctx.params;
  const { searchParams } = new URL(req.url);

  const rawPageSize = searchParams.get("pageSize");
  const cursor = searchParams.get("cursor") ?? undefined;

  const pageSize = rawPageSize ? parseInt(rawPageSize, 10) : 20;

  if (isNaN(pageSize) || pageSize < 1 || pageSize > 50) {
    return NextResponse.json(
      { error: "pageSize must be between 1 and 50" },
      { status: 400 },
    );
  }

  const { events, nextCursor } = await TimelineRepo.getByOrder(
    orderId,
    pageSize,
    cursor,
  );

  return NextResponse.json({ events, nextCursor });
}
