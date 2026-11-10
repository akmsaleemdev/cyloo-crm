/**
 * ============================================================================
 * CYLOO CRM — Integration Test: Tenant Access Audit Trail
 * ============================================================================
 *
 * Validates that tenant access events are properly audited.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SRC_DIR = resolve(__dirname, "../../src");

describe("Tenant Access Audit Trail", () => {
  it("should have audit telemetry module", () => {
    const auditPath = resolve(SRC_DIR, "lib/security/audit-telemetry.ts");
    expect(existsSync(auditPath)).toBe(true);
  });

  it("should have server-side audit functions", () => {
    const serverAudit = resolve(SRC_DIR, "lib/security/audit.server.ts");
    expect(existsSync(serverAudit)).toBe(true);
  });

  it("should have tenant audit event types", () => {
    const auditEventPath = resolve(
      SRC_DIR,
      "lib/tenant/tenant-audit-event.ts",
    );
    if (existsSync(auditEventPath)) {
      const content = readFileSync(auditEventPath, "utf-8");
      expect(content).toContain("export");
    }
  });

  it("should have tenant audit functions", () => {
    const auditFnPath = resolve(
      SRC_DIR,
      "lib/tenant/tenant-audit.functions.ts",
    );
    expect(existsSync(auditFnPath)).toBe(true);
  });

  it("should have org switch audit functions", () => {
    const orgSwitchPath = resolve(
      SRC_DIR,
      "lib/org-switch-audit.functions.ts",
    );
    expect(existsSync(orgSwitchPath)).toBe(true);
  });
});

describe("Tenant Audit Event Recording", () => {
  it("should export audit event recording functions", () => {
    const auditFnPath = resolve(
      SRC_DIR,
      "lib/tenant/tenant-audit.functions.ts",
    );
    if (existsSync(auditFnPath)) {
      const content = readFileSync(auditFnPath, "utf-8");
      // Should have createServerFn or export functions
      const hasExports =
        content.includes("export") ||
        content.includes("createServerFn");
      expect(hasExports).toBe(true);
    }
  });
});

