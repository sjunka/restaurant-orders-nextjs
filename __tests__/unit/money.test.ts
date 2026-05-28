import { describe, it, expect } from "vitest";
import { formatCents } from "@/shared/utils/money";

describe("formatCents", () => {
  it("formats whole dollars", () => {
    expect(formatCents(1000)).toBe("$10.00");
  });

  it("formats cents", () => {
    expect(formatCents(99)).toBe("$0.99");
  });

  it("formats zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });
});
