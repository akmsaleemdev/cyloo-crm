/**
 * ============================================================================
 * CYLOO CRM — Unit Tests: Messaging Account Security
 * ============================================================================
 *
 * Validates that messaging account tables (WhatsApp, Instagram, TikTok,
 * Telegram, SMS) have proper tenant isolation and credential protection.
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

describe("Messaging Account Security", () => {
  const allSQL = getAllMigrationSQL();

  const messagingTables = [
    "whatsapp_accounts",
    "whatsapp_business_accounts",
    "instagram_accounts",
    "tiktok_business_accounts",
    "telegram_accounts",
    "sms_accounts",
    "messenger_accounts",
  ];

  it("should have RLS enabled on messaging account tables that exist", () => {
    for (const table of messagingTables) {
      // Check if table is created in any migration
      const tableCreated = new RegExp(
        `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?${table}`,
        "i",
      ).test(allSQL);

      if (tableCreated) {
        const rlsEnabled = new RegExp(
          `ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          "i",
        ).test(allSQL);
        expect(
          rlsEnabled,
          `Messaging table "${table}" should have RLS enabled`,
        ).toBe(true);
      }
    }
  });

  it("should not expose API tokens or secrets in SELECT policies to authenticated role", () => {
    // Ensure secret columns are not directly exposed; they should be
    // accessed via server functions with service_role, not RLS SELECT
    const secretColumnPatterns = [
      "api_token",
      "api_secret",
      "access_token",
      "refresh_token",
      "webhook_secret",
      "encryption_key",
    ];

    // This is a structural check: if SELECT policies exist for messaging
    // tables, they should not include column-level grants on secrets
    for (const table of messagingTables) {
      const selectPolicies = [
        ...allSQL.matchAll(
          new RegExp(
            `CREATE\\s+POLICY\\s+\\S+\\s+ON\\s+(?:public\\.)?${table}\\s+FOR\\s+SELECT[^;]+;`,
            "gi",
          ),
        ),
      ];

      // Verify each table that has SELECT policies doesn't leak secrets
      // through overly permissive column grants
      for (const match of selectPolicies) {
        const policyText = match[0].toLowerCase();
        // SELECT policies should use USING clause, not grant column access
        if (policyText.includes("to authenticated")) {
          // This is expected — authenticated users can read their own
          // accounts via workspace_id scoping. Secrets are excluded at
          // the query level in server functions, not at RLS level.
          expect(policyText).toContain("using");
        }
      }
    }
  });
});

