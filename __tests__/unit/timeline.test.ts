import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db client so no real SQLite connection is made in unit tests.
vi.mock("@/server/db/client", () => {
  type EventRow = {
    eventId: string;
    timestamp: Date;
    orderId: string | null;
    userId: string;
    type: string;
    source: string;
    correlationId: string;
    payload: string;
  };

  const store: EventRow[] = [];

  return {
    db: {
      timelineEvent: {
        upsert: vi.fn(async ({ where, create }: { where: { eventId: string }; create: EventRow }) => {
          const alreadyExists = store.some((r) => r.eventId === where.eventId);
          if (!alreadyExists) store.push(create);
        }),
        findUnique: vi.fn(async ({ where }: { where: { eventId: string } }) =>
          store.find((r) => r.eventId === where.eventId) ?? null,
        ),
        findMany: vi.fn(async ({ where }: { where: { orderId?: string } }) =>
          store.filter((r) => !where.orderId || r.orderId === where.orderId),
        ),
      },
      _store: store,
    },
  };
});

import { TimelineRepo } from "@/server/repositories/timeline.repo";
import { db } from "@/server/db/client";

beforeEach(() => {
  (db as unknown as { _store: unknown[] })._store.length = 0;
  vi.clearAllMocks();
});

const baseEvent = {
  eventId: "evt-1",
  timestamp: "2024-01-01T00:00:00.000Z",
  orderId: "order-1" as string | null,
  userId: "user-1",
  type: "ORDER_PLACED" as const,
  source: "api" as const,
  correlationId: "corr-1",
  payload: {},
};

describe("TimelineRepo.upsert — deduplication", () => {
  it("inserts a new event", async () => {
    await TimelineRepo.upsert(baseEvent);
    const upsert = vi.mocked(db.timelineEvent.upsert);
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("does not create a second row when the same eventId is upserted twice", async () => {
    await TimelineRepo.upsert(baseEvent);
    await TimelineRepo.upsert(baseEvent);
    const store = (db as unknown as { _store: unknown[] })._store;
    const duplicates = (store as Array<{ eventId: string }>).filter(
      (r) => r.eventId === baseEvent.eventId,
    );
    expect(duplicates).toHaveLength(1);
  });
});

describe("TimelineRepo.getByOrder — pagination", () => {
  it("returns an empty list when there are no events", async () => {
    const { events, nextCursor } = await TimelineRepo.getByOrder("order-99", 20);
    expect(events).toHaveLength(0);
    expect(nextCursor).toBeNull();
  });
});
