import { describe, it, expect, vi, beforeEach } from "vitest";

// Stub every repository so the test never touches a real database.
vi.mock("@/server/repositories/idempotency.repo", () => ({
  IdempotencyRepo: {
    find: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/server/repositories/order.repo", () => ({
  OrderRepo: {
    create: vi.fn().mockResolvedValue(undefined),
    updateStatus: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/server/repositories/menu.repo", () => ({
  MenuRepo: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: "prod-fries",
        name: "Crispy Fries",
        description: "Sea salt fries",
        basePriceInCents: 449,
        category: "Sides",
        modifierGroups: [],
      },
    ]),
  },
}));

vi.mock("@/server/repositories/timeline.repo", () => ({
  TimelineRepo: { upsert: vi.fn().mockResolvedValue(undefined) },
}));

// Don't actually fire the async status-change loop in tests.
vi.mock("@/server/services/order.service", () => ({
  simulateOrderProcessing: vi.fn(),
}));

import { POST } from "@/app/api/orders/route";
import { NextRequest } from "next/server";

const VALID_ITEM = {
  cartItemId: "cart-item-1",
  productId: "prod-fries",
  name: "Crispy Fries",
  basePriceInCents: 449,
  modifiers: [],
  quantity: 1,
};

function buildRequest(body: unknown, idempotencyKey = "key-001") {
  return new NextRequest("http://localhost/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/orders", () => {
  it("returns 202 with a new orderId for a valid request", async () => {
    const req = buildRequest({
      userId: "user-1",
      items: [VALID_ITEM],
      correlationId: "corr-1",
    });

    const res = await POST(req);

    expect(res.status).toBe(202);
    const body = await res.json() as { orderId: string };
    expect(typeof body.orderId).toBe("string");
    expect(body.orderId.length).toBeGreaterThan(0);
  });

  it("returns 400 when the Idempotency-Key header is missing", async () => {
    const req = new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "u1", items: [VALID_ITEM], correlationId: "c1" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when items is an empty array", async () => {
    const res = await POST(buildRequest({ userId: "u1", items: [], correlationId: "c1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const req = new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "k1" },
      body: "not json at all",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
