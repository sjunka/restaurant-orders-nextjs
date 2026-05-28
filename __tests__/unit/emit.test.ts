import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/repositories/timeline.repo", () => ({
  TimelineRepo: { upsert: vi.fn() },
}));

import { emitEvent } from "@/server/events/emit";
import { TimelineRepo } from "@/server/repositories/timeline.repo";

beforeEach(() => vi.clearAllMocks());

describe("emitEvent", () => {
  const base = {
    orderId: "order-1",
    userId: "u1",
    type: "ORDER_PLACED" as const,
    source: "api" as const,
    correlationId: "corr-1",
  };

  it("persists a valid event", async () => {
    vi.mocked(TimelineRepo.upsert).mockResolvedValue(undefined);
    await emitEvent({ ...base, payload: { foo: "bar" } });
    expect(TimelineRepo.upsert).toHaveBeenCalledOnce();
  });

  it("throws PAYLOAD_TOO_LARGE when payload exceeds 16KB", async () => {
    const big = { data: "x".repeat(17 * 1024) };
    await expect(emitEvent({ ...base, payload: big })).rejects.toThrow(
      "PAYLOAD_TOO_LARGE",
    );
    expect(TimelineRepo.upsert).not.toHaveBeenCalled();
  });

  it("masks emails in payload", async () => {
    vi.mocked(TimelineRepo.upsert).mockResolvedValue(undefined);
    await emitEvent({
      ...base,
      payload: { email: "user@example.com" },
    });

    const saved = vi.mocked(TimelineRepo.upsert).mock.calls[0][0];
    expect(JSON.stringify(saved.payload)).not.toContain("user@example.com");
  });

  it("assigns eventId and timestamp", async () => {
    vi.mocked(TimelineRepo.upsert).mockResolvedValue(undefined);
    await emitEvent({ ...base, payload: {} });
    const saved = vi.mocked(TimelineRepo.upsert).mock.calls[0][0];
    expect(saved.eventId).toBeTruthy();
    expect(saved.timestamp).toBeTruthy();
  });
});
