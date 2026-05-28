import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/repositories/idempotency.repo", () => ({
  IdempotencyRepo: {
    find: vi.fn(),
    save: vi.fn(),
  },
}));

import { withIdempotency } from "@/server/services/idempotency.service";
import { IdempotencyRepo } from "@/server/repositories/idempotency.repo";

const mockFind = vi.mocked(IdempotencyRepo.find);
const mockSave = vi.mocked(IdempotencyRepo.save);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withIdempotency", () => {
  it("calls fn and saves when cache is empty", async () => {
    mockFind.mockResolvedValue(null);
    mockSave.mockResolvedValue(undefined);

    const fn = vi.fn().mockResolvedValue({ orderId: "abc" });
    const { result, fromCache } = await withIdempotency("key-1", fn);

    expect(fn).toHaveBeenCalledOnce();
    expect(mockSave).toHaveBeenCalledWith("key-1", { orderId: "abc" });
    expect(result).toEqual({ orderId: "abc" });
    expect(fromCache).toBe(false);
  });

  it("returns cached response without calling fn", async () => {
    mockFind.mockResolvedValue({ response: { orderId: "cached" } });

    const fn = vi.fn();
    const { result, fromCache } = await withIdempotency("key-2", fn);

    expect(fn).not.toHaveBeenCalled();
    expect(result).toEqual({ orderId: "cached" });
    expect(fromCache).toBe(true);
  });

  it("does not double-write when called with same key twice", async () => {
    mockFind.mockResolvedValueOnce(null).mockResolvedValue({ response: "x" });
    mockSave.mockResolvedValue(undefined);

    const fn = vi.fn().mockResolvedValue("x");
    await withIdempotency("key-3", fn);
    await withIdempotency("key-3", fn);

    expect(fn).toHaveBeenCalledOnce();
    expect(mockSave).toHaveBeenCalledOnce();
  });
});
