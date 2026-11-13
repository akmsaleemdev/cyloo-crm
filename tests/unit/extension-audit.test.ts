import { describe, expect, it } from "vitest";
import { validateExtensionAuditResult } from "../../scripts/lib/extension-audit.mjs";

describe("Extension catalog audit evidence", () => {
  it("accepts an explicitly empty catalog result", () => {
    expect(() => validateExtensionAuditResult({ data: [], error: null })).not.toThrow();
  });
  it("rejects an unavailable RPC rather than claiming a successful probe", () => {
    expect(() => validateExtensionAuditResult({ data: null, error: { code: "PGRST202" } })).toThrow(
      "unavailable",
    );
  });
  it("rejects malformed evidence and exposed helper functions", () => {
    expect(() => validateExtensionAuditResult({ data: null, error: null })).toThrow(
      "invalid result",
    );
    expect(() =>
      validateExtensionAuditResult({ data: [{ function_name: "similarity" }], error: null }),
    ).toThrow("public schema");
  });
});
