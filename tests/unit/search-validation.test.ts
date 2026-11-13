// @vitest-environment node
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fallback, zodValidator } from "@/lib/validation/search";

describe("route search validation", () => {
  const validator = zodValidator(
    z.object({
      days: fallback(z.number().int(), 30).default(30),
      tab: fallback(z.string(), "overview").default("overview"),
      org: z.string().uuid().optional(),
    }),
  );

  it("accepts valid search values and supplies missing defaults", () => {
    expect(validator.parse({})).toEqual({ days: 30, tab: "overview" });
    expect(validator.parse({ days: 7, tab: "usage" })).toEqual({ days: 7, tab: "usage" });
  });

  it("falls back for malformed analytics filters", () => {
    expect(validator.parse({ days: "invalid", tab: 42 })).toEqual({ days: 30, tab: "overview" });
  });

  it("still rejects an invalid organization id", () => {
    expect(() => validator.parse({ org: "invalid" })).toThrow();
  });
});
