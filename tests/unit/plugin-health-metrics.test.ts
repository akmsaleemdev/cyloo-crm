import { describe, expect, it } from "vitest";
import { averageErrorRate } from "@/lib/plugins/health-metrics";

describe("Plugin health metrics", () => {
  it("handles no samples", () => expect(averageErrorRate([])).toBe(0));
  it("averages numeric and serialized database values", () => {
    expect(averageErrorRate([{ error_rate: 0.1 }, { error_rate: "0.3" }])).toBeCloseTo(0.2);
  });
  it("keeps missing and invalid samples from producing NaN", () => {
    expect(
      averageErrorRate([{}, { error_rate: "invalid" }, { error_rate: null }, { error_rate: 0.4 }]),
    ).toBeCloseTo(0.1);
  });
});
