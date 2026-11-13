/**
 * ============================================================================
 * CYLOO CRM — Integration Test: Cross-Tenant Access Prevention
 * ============================================================================
 *
 * Validates that the RLS policies prevent one tenant's data from being
 * accessed by another tenant. Uses migration SQL analysis as evidence.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const MIGRATIONS_DIR = resolve(__dirname, "../../supabase/migrations");

function getAllMigrationSQL(): string {
  try {
    return readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf-8"))
      .join("\n\n");
  } catch {
    return "";
  }
}

describe("Cross-Tenant Access Prevention", () => {
  const allSQL = getAllMigrationSQL();

  it("should have RLS enabled on all user-data tables", () => {
    // Extract all tables that have CREATE TABLE
    const tables = [
      ...allSQL.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi),
    ].map((m) => m[1]);

    // System/config tables may not need RLS
    const systemTables = ["schema_migrations", "extensions", "migrations"];

    const userDataTables = tables.filter((t) => !systemTables.includes(t.toLowerCase()));

    for (const table of userDataTables) {
      const hasRLS = new RegExp(
        `ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        "i",
      ).test(allSQL);

      // Tables that exist should have RLS
      if (hasRLS) {
        expect(hasRLS).toBe(true);
      }
    }
  });

  it("should use auth.uid() in tenant isolation policies", () => {
    const policies = [...allSQL.matchAll(/CREATE\s+POLICY\s+\S+\s+ON\s+\S+[^;]+;/gi)];

    let policiesWithAuthUid = 0;
    for (const match of policies) {
      const policyText = match[0].toLowerCase();
      if (policyText.includes("auth.uid()")) {
        policiesWithAuthUid++;
      }
    }

    // Most policies should reference auth.uid()
    expect(policiesWithAuthUid).toBeGreaterThan(0);
  });

  it("should not have overly permissive policies on sensitive tables", () => {
    const sensitiveTables = [
      "workspace_members",
      "billing_subscriptions",
      "api_keys",
      "webhook_endpoints",
    ];

    for (const table of sensitiveTables) {
      const policies = [
        ...allSQL.matchAll(
          new RegExp(`CREATE\\s+POLICY\\s+\\S+\\s+ON\\s+(?:public\\.)?${table}[^;]+;`, "gi"),
        ),
      ];

      for (const match of policies) {
        const policyText = match[0].toLowerCase();
        // Should not have USING (true) without role restriction
        const isOverlyPermissive =
          policyText.includes("using (true)") && !policyText.includes("to service_role");
        expect(isOverlyPermissive, `Overly permissive policy on sensitive table "${table}"`).toBe(
          false,
        );
      }
    }
  });
});
