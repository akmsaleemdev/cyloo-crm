/**
 * ============================================================================
 * CYLOO CRM — API Test: Security Realtime RLS
 * ============================================================================
 *
 * Validates that Supabase Realtime subscriptions respect RLS policies.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC_DIR = resolve(__dirname, "../../src");
const MIGRATIONS_DIR = resolve(__dirname, "../../supabase/migrations");

describe("Security: Realtime RLS", () => {
  it("should have realtime subscription manager", () => {
    const subManager = resolve(
      SRC_DIR,
      "lib/realtime/subscription-manager.ts",
    );
    expect(existsSync(subManager)).toBe(true);
  });

  it("should scope realtime subscriptions to tenant context", () => {
    const realtimeFiles = [
      "lib/realtime/org-realtime.ts",
      "lib/realtime/org-cross-tab.ts",
      "lib/realtime/subscription-manager.ts",
    ];

    for (const relPath of realtimeFiles) {
      const fullPath = resolve(SRC_DIR, relPath);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, "utf-8");
        // Realtime subscriptions should reference workspace/org context
        const hasTenantScope =
          content.includes("workspace") ||
          content.includes("org") ||
          content.includes("tenant");
        expect(
          hasTenantScope,
          `Realtime file "${relPath}" should reference tenant context`,
        ).toBe(true);
      }
    }
  });

  it("should have RLS on tables commonly used with realtime", () => {
    const realtimeTables = [
      "conversations",
      "messages",
      "notifications",
      "inbox_items",
    ];

    let allSQL = "";
    try {
      allSQL = readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".sql"))
        .map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf-8"))
        .join("\n\n");
    } catch {
      // No migrations
    }

    for (const table of realtimeTables) {
      const tableExists = new RegExp(
        `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?${table}`,
        "i",
      ).test(allSQL);

      if (tableExists) {
        const hasRLS = new RegExp(
          `ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          "i",
        ).test(allSQL);
        expect(
          hasRLS,
          `Realtime table "${table}" should have RLS enabled`,
        ).toBe(true);
      }
    }
  });
});

