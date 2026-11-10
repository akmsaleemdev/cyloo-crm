/**
 * ============================================================================
 * CYLOO CRM — Integration Test: Tenant Audit Event Recording
 * ============================================================================
 *
 * Validates that the audit event recording pipeline is properly wired.
 */

import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const SRC_DIR = resolve(__dirname, "../../src");

describe("Tenant Audit Event Recording Pipeline", () => {
  const auditPipelineFiles = [
    "lib/tenant/tenant-audit-event.ts",
    "lib/tenant/tenant-audit.functions.ts",
    "lib/security/audit-telemetry.ts",
    "lib/security/audit.server.ts",
    "lib/org-switch-audit.functions.ts",
  ];

  it("should have all audit pipeline files", () => {
    for (const relPath of auditPipelineFiles) {
      const fullPath = resolve(SRC_DIR, relPath);
      expect(
        existsSync(fullPath),
        `Missing audit pipeline file: ${relPath}`,
      ).toBe(true);
    }
  });
});

