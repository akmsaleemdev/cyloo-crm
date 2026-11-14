import { describe, expect, it } from "vitest";
import {
  suggestedStandardRate,
  taxBreakdown,
  taxDisplayName,
} from "@/lib/billing/tax-jurisdiction";

describe("country-aware tax presentation", () => {
  it("uses regional tax names without inferring a rate from currency", () => {
    expect(taxDisplayName("AE")).toBe("VAT");
    expect(taxDisplayName("SA")).toBe("VAT");
    expect(taxDisplayName("IN")).toBe("GST");
    expect(taxDisplayName("US")).toBe("Sales tax");
    expect(taxDisplayName(null)).toBe("Tax");
    expect(suggestedStandardRate("AE")).toBe(5);
    expect(suggestedStandardRate("SA")).toBe(15);
    expect(suggestedStandardRate("IN")).toBeNull();
    expect(suggestedStandardRate("US")).toBeNull();
  });

  it("splits configured Indian GST into CGST and SGST for intra-state supplies", () => {
    expect(taxBreakdown("IN", 1000, 18, "intra_state")).toEqual([
      { code: "CGST", rate: 9, amount: 90 },
      { code: "SGST/UTGST", rate: 9, amount: 90 },
    ]);
  });

  it("uses IGST for inter-state supplies", () => {
    expect(taxBreakdown("IN", 1000, 18, "inter_state"))
      .toEqual([{ code: "IGST", rate: 18, amount: 180 }]);
  });

  it("does not silently choose between intra-state and inter-state", () => {
    expect(() => taxBreakdown("IN", 1000, 18)).toThrow(/supply type/i);
  });

  it("preserves rounded totals across India split", () => {
    const entries = taxBreakdown("IN", 5.5, 5, "intra_state");
    expect(entries.reduce((total, row) => total + row.amount, 0)).toBeCloseTo(0.28, 2);
  });

  it("rejects invalid rates", () => {
    expect(() => taxBreakdown("AE", 100, 101)).toThrow();
    expect(() => taxBreakdown("IN", 100, -1, "inter_state")).toThrow();
  });
});
