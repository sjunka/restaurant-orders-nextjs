import { db } from "@/server/db/client";
import type { TimelineEvent } from "@/shared/types/timeline";

export const TimelineRepo = {
  // upsert ensures that replaying the same event doesn't create duplicates.
  async upsert(event: TimelineEvent): Promise<void> {
    await db.timelineEvent.upsert({
      where: { eventId: event.eventId },
      update: {}, // already exists — nothing to change
      create: {
        eventId: event.eventId,
        timestamp: new Date(event.timestamp),
        orderId: event.orderId ?? null,
        userId: event.userId,
        type: event.type,
        source: event.source,
        correlationId: event.correlationId,
        payload: JSON.stringify(event.payload),
      },
    });
  },

  async getByOrder(
    orderId: string,
    pageSize: number,
    afterEventId?: string,
  ): Promise<{ events: TimelineEvent[]; nextCursor: string | null }> {
    // For cursor-based pagination we need the timestamp of the pivot event
    // so we can fetch everything that came after it.
    let afterTimestamp: Date | undefined;
    if (afterEventId) {
      const pivot = await db.timelineEvent.findUnique({
        where: { eventId: afterEventId },
        select: { timestamp: true },
      });
      afterTimestamp = pivot?.timestamp;
    }

    const rows = await db.timelineEvent.findMany({
      where: {
        orderId,
        ...(afterTimestamp ? { timestamp: { gt: afterTimestamp } } : {}),
      },
      orderBy: { timestamp: "asc" },
      take: pageSize + 1, // fetch one extra to know if there are more pages
    });

    const hasMore = rows.length > pageSize;
    const page = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore ? page[page.length - 1].eventId : null;

    const events: TimelineEvent[] = page.map((row) => ({
      eventId: row.eventId,
      timestamp: row.timestamp.toISOString(),
      orderId: row.orderId,
      userId: row.userId,
      type: row.type as TimelineEvent["type"],
      source: row.source as TimelineEvent["source"],
      correlationId: row.correlationId,
      payload: JSON.parse(row.payload) as Record<string, unknown>,
    }));

    return { events, nextCursor };
  },
};
