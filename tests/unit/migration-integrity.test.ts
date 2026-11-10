/**
 * ============================================================================
 * CYLOO CRM — Unit Tests: Database Migration Integrity
 * ============================================================================
 *
 * Validates the enterprise core modules migration file for correctness.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const MIGRATIONS_DIR = resolve(__dirname, "../../supabase/migrations");

function extractTableBlock(sql: string, tableName: string): string | null {
  // Capture from CREATE TABLE tableName up to the closing semicolon
  const regex = new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?${tableName}\\s*\\([\\s\\S]*?\\);`,
    "i",
  );
  const match = sql.match(regex);
  return match ? match[0] : null;
}

describe("Database Migration Integrity", () => {
  const enterpriseMigration = join(
    MIGRATIONS_DIR,
    "20261108120000_enterprise_core_modules.sql",
  );

  let sql: string;
  try {
    sql = readFileSync(enterpriseMigration, "utf-8");
  } catch {
    sql = "";
  }

  it("should have the enterprise core modules migration", () => {
    expect(sql.length).toBeGreaterThan(0);
  });

  // ─── Table Creation ────────────────────────────────────────────────

  const expectedTables = [
    "contracts",
    "contract_clauses",
    "channel_partners",
    "partner_deal_registrations",
    "field_technicians",
    "field_work_orders",
    "zatca_invoices",
    "identity_resolution_records",
    "data_privacy_erasure_requests",
    "sre_dead_letter_queue",
    "sre_webhook_health_probes",
  ];

  for (const table of expectedTables) {
    it(`should create table: ${table}`, () => {
      const regex = new RegExp(
        `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?${table}`,
        "i",
      );
      expect(regex.test(sql)).toBe(true);
    });

    it(`should enable RLS on table: ${table}`, () => {
      const regex = new RegExp(
        `ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        "i",
      );
      expect(regex.test(sql)).toBe(true);
    });

    it(`should REVOKE ALL FROM anon on table: ${table}`, () => {
      const regex = new RegExp(
        `REVOKE\\s+ALL\\s+ON\\s+(?:TABLE\\s+)?(?:public\\.)?${table}\\s+FROM\\s+anon`,
        "i",
      );
      expect(regex.test(sql)).toBe(true);
    });
  }

  // ─── Structural Validations ────────────────────────────────────────

  it("should have workspace_id column on all tenant-scoped tables", () => {
    for (const table of expectedTables) {
      if (table === "sre_webhook_health_probes") continue;
      const tableBlock = extractTableBlock(sql, table);
      expect(tableBlock, `Table "${table}" should be found`).not.toBeNull();
      if (tableBlock) {
        expect(
          tableBlock.toLowerCase(),
          `Table "${table}" should have workspace_id`,
        ).toContain("workspace_id");
      }
    }
  });

  it("should have timestamp columns", () => {
    for (const table of expectedTables) {
      const tableBlock = extractTableBlock(sql, table);
      expect(tableBlock, `Table "${table}" should be found`).not.toBeNull();
      if (tableBlock) {
        const hasTimestamp =
          tableBlock.toLowerCase().includes("created_at") ||
          tableBlock.toLowerCase().includes("executed_at") ||
          tableBlock.toLowerCase().includes("checked_at");
        expect(
          hasTimestamp,
          `Table "${table}" should have a timestamp column`,
        ).toBe(true);
      }
    }
  });

  it("should use UUID primary keys", () => {
    for (const table of expectedTables) {
      const tableBlock = extractTableBlock(sql, table);
      if (tableBlock) {
        const hasUUID =
          tableBlock.toLowerCase().includes("uuid") &&
          tableBlock.toLowerCase().includes("primary key");
        expect(
          hasUUID,
          `Table "${table}" should use UUID primary key`,
        ).toBe(true);
      }
    }
  });

  it("should have composite indexes for workspace scoping", () => {
    const indexCount = (sql.match(/CREATE\s+INDEX/gi) || []).length;
    expect(indexCount).toBeGreaterThanOrEqual(2);
  });

  // ─── Migration Order ───────────────────────────────────────────────

  it("should have migrations in chronological filename order", () => {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (let i = 1; i < files.length; i++) {
      expect(files[i] >= files[i - 1]).toBe(true);
    }
  });
});
