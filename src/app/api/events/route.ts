import { NextRequest, NextResponse } from "next/server";
import { emitEvent } from "@/server/events/emit";
import type { EventType, EventSource } from "@/shared/types/timeline";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const correlationId = req.headers.get("X-Correlation-Id") ?? (body.correlationId as string);
  const userId = req.headers.get("X-User-Id") ?? (body.userId as string);

  if (!correlationId || !userId) {
    return NextResponse.json(
      { error: "X-Correlation-Id and X-User-Id headers required" },
      { status: 400 },
    );
  }

  try {
    await emitEvent({
      orderId: (body.orderId as string | null) ?? null,
      userId,
      type: body.type as EventType,
      source: (body.source as EventSource) ?? "web",
      correlationId,
      payload: (body.payload as Record<string, unknown>) ?? {},
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 400 });
    }
    throw err;
  }
}
