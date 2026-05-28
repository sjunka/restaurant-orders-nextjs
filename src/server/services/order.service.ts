import type { OrderStatus } from "@/shared/types/order";
import { OrderRepo } from "@/server/repositories/order.repo";
import { emitEvent } from "@/server/events/emit";

const STATUS_FLOW: Array<{ status: OrderStatus; delayMs: number }> = [
  { status: "CONFIRMED", delayMs: 2_000 },
  { status: "PREPARING", delayMs: 5_000 },
  { status: "READY", delayMs: 10_000 },
  { status: "DELIVERED", delayMs: 15_000 },
];

export function simulateOrderProcessing(
  orderId: string,
  userId: string,
  correlationId: string,
): void {
  void (async () => {
    for (const { status, delayMs } of STATUS_FLOW) {
      await new Promise<void>((r) => setTimeout(r, delayMs));
      await OrderRepo.updateStatus(orderId, status);
      await emitEvent({
        orderId,
        userId,
        type: "ORDER_STATUS_CHANGED",
        source: "worker",
        correlationId,
        payload: { status },
      });
    }
  })();
}
