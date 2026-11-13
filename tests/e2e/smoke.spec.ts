/**
 * ============================================================================
 * CYLOO CRM — E2E Test: Smoke Test Suite
 * ============================================================================
 *
 * Quick health-check that core pages load without errors.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

test.describe("Smoke Tests", () => {
  test("should load the landing page", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/CYLOO/i);
  });

  test("should load the login page", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await expect(page.locator("form")).toBeVisible();
  });

  test("should not expose server errors on 404 pages", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/nonexistent-page-12345`);
    // Should not return 500
    expect(response?.status()).not.toBe(500);
    // Page should not show stack traces
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("Error: ");
    expect(bodyText).not.toContain("at Object.");
    expect(bodyText).not.toContain("node_modules");
  });

  test("should have correct meta tags", async ({ page }) => {
    await page.goto(BASE_URL);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    if (description) {
      expect(description.toLowerCase()).not.toContain("wrapcoders");
      expect(description.toLowerCase()).not.toContain("wacrm");
    }
  });

  test("should not have legacy branding visible", async ({ page }) => {
    await page.goto(BASE_URL);
    const bodyText = (await page.textContent("body")) ?? "";
    expect(bodyText).not.toContain("WrapCoders");
    expect(bodyText).not.toContain("WRAPCODERS");
    expect(bodyText).not.toContain("WACRM");
    expect(bodyText).not.toContain("WaCRM");
    expect(bodyText.toLowerCase()).not.toContain("monday.com");
    expect(bodyText.toLowerCase()).not.toContain("lovable");
  });
});
