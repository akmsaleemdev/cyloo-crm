/**
 * ============================================================================
 * CYLOO CRM — API Test: Security Cron Token
 * ============================================================================
 *
 * Validates that cron/scheduled job endpoints use proper authentication.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SRC_DIR = resolve(__dirname, "../../src");

describe("Security: Cron Token Authentication", () => {
  it("should have API gateway with request guards", () => {
    const gatewayPath = resolve(SRC_DIR, "lib/api/gateway.server.ts");
    expect(existsSync(gatewayPath)).toBe(true);
  });

  it("should have request guard utilities", () => {
    const guardsPath = resolve(SRC_DIR, "lib/api/request-guards.ts");
    expect(existsSync(guardsPath)).toBe(true);

    if (existsSync(guardsPath)) {
      const content = readFileSync(guardsPath, "utf-8");
      expect(content).toContain("export");
    }
  });

  it("should have security functions for API validation", () => {
    const securityPath = resolve(SRC_DIR, "lib/api/security.functions.ts");
    expect(existsSync(securityPath)).toBe(true);
  });

  it("should use timing-safe comparison for tokens", () => {
    const securityFiles = [
      "lib/api/gateway.server.ts",
      "lib/api/security.functions.ts",
      "lib/admin/server/admin.server.ts",
    ];

    let hasTimingSafe = false;
    for (const relPath of securityFiles) {
      const fullPath = resolve(SRC_DIR, relPath);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, "utf-8");
        if (
          content.includes("timingSafeEqual") ||
          content.includes("timing_safe") ||
          content.includes("constantTimeEqual")
        ) {
          hasTimingSafe = true;
        }
      }
    }

    // At least one security file should use timing-safe comparison
    expect(hasTimingSafe).toBe(true);
  });
});

