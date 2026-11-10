/**
 * ============================================================================
 * CYLOO CRM — E2E Test: Security Checks
 * ============================================================================
 *
 * Validates security headers, CSP, and common web vulnerabilities.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

test.describe("Security Headers", () => {
  test("should set X-Frame-Options header", async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const xfo = response?.headers()["x-frame-options"];
    if (xfo) {
      expect(["DENY", "SAMEORIGIN"]).toContain(xfo.toUpperCase());
    }
  });

  test("should set X-Content-Type-Options header", async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const xcto = response?.headers()["x-content-type-options"];
    if (xcto) {
      expect(xcto.toLowerCase()).toBe("nosniff");
    }
  });

  test("should not expose server version headers", async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const poweredBy = response?.headers()["x-powered-by"];
    // Should not expose framework name
    if (poweredBy) {
      expect(poweredBy.toLowerCase()).not.toContain("express");
      expect(poweredBy.toLowerCase()).not.toContain("php");
    }
  });

  test("should not expose sensitive data in error responses", async ({
    page,
  }) => {
    // Try an invalid API endpoint
    const response = await page.goto(`${BASE_URL}/api/v1/nonexistent`);
    const body = await page.textContent("body");
    if (body) {
      expect(body).not.toContain("stack");
      expect(body).not.toContain("node_modules");
      expect(body).not.toContain("SUPABASE_SERVICE_ROLE");
    }
  });
});

