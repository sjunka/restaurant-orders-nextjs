import { describe, it, expect } from "vitest";
import { maskPII } from "@/server/events/mask-pii";

describe("maskPII", () => {
  it("masks email addresses", () => {
    const result = maskPII({ contact: "hello@example.com" });
    expect(JSON.stringify(result)).not.toContain("hello@example.com");
    expect(JSON.stringify(result)).toContain("@example.com");
  });

  it("masks US phone numbers", () => {
    const result = maskPII({ phone: "555-867-5309" });
    expect(JSON.stringify(result)).not.toContain("867-5309");
  });

  it("leaves non-PII fields untouched", () => {
    const result = maskPII({ name: "Burger", price: 999 });
    expect(result).toEqual({ name: "Burger", price: 999 });
  });

  it("handles nested objects", () => {
    const result = maskPII({ user: { email: "a@b.com", name: "Alice" } });
    const str = JSON.stringify(result);
    expect(str).not.toContain("a@b.com");
    expect(str).toContain("Alice");
  });
});
