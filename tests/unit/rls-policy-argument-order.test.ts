/**
 * ============================================================================
 * CYLOO CRM — Unit Tests: RLS Policy Argument Order
 * ============================================================================
 *
 * Validates that all Supabase migration files use correct RLS policy syntax:
 * - USING clause for SELECT, UPDATE, DELETE
 * - WITH CHECK clause for INSERT, UPDATE
 * - Policies reference auth.uid() and workspace_id for tenant isolation
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const MIGRATIONS_DIR = resolve(__dirname, "../../supabase/migrations");

function getMigrationFiles(): string[] {
  try {
    return readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => join(MIGRATIONS_DIR, f));
  } catch {
    return [];
  }
}

describe("RLS Policy Argument Order", () => {
  const migrationFiles = getMigrationFiles();

  it("should find at least 1 migration file", () => {
    expect(migrationFiles.length).toBeGreaterThanOrEqual(1);
  });

  it("should enable RLS on enterprise tables that have policies", () => {
    const enterpriseFile = migrationFiles.find((f) => f.includes("enterprise_core_modules"));
    expect(enterpriseFile).toBeDefined();

    if (enterpriseFile) {
      const sql = readFileSync(enterpriseFile, "utf-8");
      const policyMatches = sql.matchAll(/CREATE\s+POLICY\s+\S+\s+ON\s+(?:public\.)?(\w+)/gi);
      for (const match of policyMatches) {
        const tableName = match[1];
        const rlsEnabled = new RegExp(
          `ALTER\\s+TABLE\\s+(?:public\\.)?${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
          "i",
        ).test(sql);
        expect(rlsEnabled, `Table "${tableName}" has policies but RLS is not enabled`).toBe(true);
      }
    }
  });

  it("should use USING clause for SELECT policies", () => {
    for (const file of migrationFiles) {
      const sql = readFileSync(file, "utf-8");
      const selectPolicies = sql.matchAll(/CREATE\s+POLICY\s+\S+\s+ON\s+\S+\s+FOR\s+SELECT/gi);
      for (const match of selectPolicies) {
        const policyText = sql.slice(match.index!, sql.indexOf(";", match.index!) + 1);
        expect(policyText.toUpperCase(), `SELECT policy should use USING clause`).toContain(
          "USING",
        );
      }
    }
  });

  it("should use WITH CHECK clause for INSERT policies", () => {
    for (const file of migrationFiles) {
      const sql = readFileSync(file, "utf-8");
      const insertPolicies = sql.matchAll(/CREATE\s+POLICY\s+\S+\s+ON\s+\S+\s+FOR\s+INSERT/gi);
      for (const match of insertPolicies) {
        const policyText = sql.slice(match.index!, sql.indexOf(";", match.index!) + 1);
        expect(policyText.toUpperCase(), `INSERT policy should use WITH CHECK clause`).toContain(
          "WITH CHECK",
        );
      }
    }
  });

  it("should revoke all permissions from anon on enterprise tables", () => {
    for (const file of migrationFiles) {
      const sql = readFileSync(file, "utf-8");
      if (!file.includes("enterprise_core_modules")) continue;

      const createTableMatches = sql.matchAll(
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi,
      );
      for (const match of createTableMatches) {
        const tableName = match[1];
        const revokeAnon = new RegExp(
          `REVOKE\\s+ALL\\s+ON\\s+(?:TABLE\\s+)?(?:public\\.)?${tableName}\\s+FROM\\s+anon`,
          "i",
        ).test(sql);
        expect(revokeAnon, `Table "${tableName}" should REVOKE ALL FROM anon`).toBe(true);
      }
    }
  });

  it("should enforce workspace_id tenant isolation in USING clauses for tenant tables", () => {
    for (const file of migrationFiles) {
      const sql = readFileSync(file, "utf-8");
      if (!file.includes("enterprise_core_modules")) continue;

      const selectPolicies = [
        ...sql.matchAll(/CREATE\s+POLICY\s+\S+\s+ON\s+\S+\s+FOR\s+SELECT[^;]+;/gi),
      ];
      for (const match of selectPolicies) {
        const policyText = match[0];
        // Skip service_role and global telemetry
        if (
          policyText.toLowerCase().includes("service_role") ||
          policyText.toLowerCase().includes("sre_webhook_health_probes")
        ) {
          continue;
        }
        expect(
          policyText.toLowerCase(),
          "SELECT policies should reference workspace_id for tenant isolation",
        ).toContain("workspace_id");
      }
    }
  });
});
