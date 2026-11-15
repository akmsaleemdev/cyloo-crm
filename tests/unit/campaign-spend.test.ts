import { describe, expect, it } from "vitest";
import { campaignSpendFromSnapshot } from "@/lib/bi/campaign-spend";

describe("campaign spend snapshot", () => {
  it("reads numeric and numeric-string spend values", () => {
    expect(campaignSpendFromSnapshot({ spend: 125 })).toBe(125);
    expect(campaignSpendFromSnapshot({ budget: "75.5" })).toBe(75.5);
  });

  it("returns zero for missing, malformed, and non-finite values", () => {
    expect(campaignSpendFromSnapshot(null)).toBe(0);
    expect(campaignSpendFromSnapshot({})).toBe(0);
    expect(campaignSpendFromSnapshot({ spend: "invalid" })).toBe(0);
    expect(campaignSpendFromSnapshot({ spend: Infinity })).toBe(0);
  });
});
