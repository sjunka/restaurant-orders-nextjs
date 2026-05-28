import { randomUUID } from "crypto";
import type { TimelineEvent } from "@/shared/types/timeline";
import { TimelineRepo } from "@/server/repositories/timeline.repo";
import { maskPII } from "./mask-pii";
import { logger } from "@/server/lib/logger";

const MAX_PAYLOAD_BYTES = 16 * 1024;

type EmitInput = Omit<TimelineEvent, "eventId" | "timestamp">;

export async function emitEvent(input: EmitInput): Promise<void> {
  const payloadStr = JSON.stringify(input.payload);
  if (Buffer.byteLength(payloadStr) > MAX_PAYLOAD_BYTES) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }

  const event: TimelineEvent = {
    ...input,
    eventId: randomUUID(),
    timestamp: new Date().toISOString(),
    payload: maskPII(input.payload),
  };

  logger.info({ eventId: event.eventId, type: event.type }, "event emitted");

  await TimelineRepo.upsert(event);
}
