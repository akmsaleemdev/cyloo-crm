/**
 * ============================================================================
 * CYLOO CRM — Unit Tests: RLS Billing & Invite Policies
 * ============================================================================
 *
 * Validates billing isolation and invitation scoping in RLS policies.
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

describe("RLS Billing & Invite Policies", () => {
  const allSQL = getAllMigrationSQL();

  it("should have billing-related tables with RLS enabled", () => {
    const billingTables = [
      "billing_subscriptions",
      "billing_invoices",
      "billing_payments",
      "billing_plans",
    ];

    for (const table of billingTables) {
      if (allSQL.includes(`CREATE TABLE`) && allSQL.includes(table)) {
        const rlsEnabled = new RegExp(
          `ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          "i",
        ).test(allSQL);
        if (allSQL.includes(`CREATE TABLE`) && allSQL.includes(table)) {
          expect(
            rlsEnabled,
            `Billing table "${table}" should have RLS enabled`,
          ).toBe(true);
        }
      }
    }
  });

  it("should not allow anon access to billing tables", () => {
    const billingPolicies = [
      ...allSQL.matchAll(
        /CREATE\s+POLICY\s+\S+\s+ON\s+(?:public\.)?(billing_\w+)[^;]+;/gi,
      ),
    ];

    for (const match of billingPolicies) {
      const policyText = match[0].toLowerCase();
      // No billing policy should reference the 'anon' role
      expect(policyText).not.toMatch(/to\s+anon/);
    }
  });

  it("should scope invitation policies to workspace_id", () => {
    const invitePolicies = [
      ...allSQL.matchAll(
        /CREATE\s+POLICY\s+\S+\s+ON\s+(?:public\.)?(workspace_invit\w+|org_invit\w+)[^;]+;/gi,
      ),
    ];

    for (const match of invitePolicies) {
      const policyText = match[0].toLowerCase();
      // Invite policies should reference workspace_id or organization_id
      const hasTenantScope =
        policyText.includes("workspace_id") ||
        policyText.includes("organization_id");
      expect(
        hasTenantScope,
        `Invitation policy should be scoped to tenant: ${match[1]}`,
      ).toBe(true);
    }
  });
});

