/**
 * ============================================================================
 * CYLOO CRM — Unit Tests: Branding & License Compliance
 * ============================================================================
 *
 * Automated verification that:
 * - No legacy brand names appear in user-facing code
 * - LICENSE file has correct CYLOO CRM copyright
 * - No Envato/CodeCanyon references remain
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

describe("Branding Compliance", () => {
  it("should have CYLOO CRM copyright in LICENSE file", () => {
    const licensePath = resolve(ROOT, "LICENSE");
    expect(existsSync(licensePath)).toBe(true);

    const content = readFileSync(licensePath, "utf-8");
    expect(content).toContain("CYLOO CRM");
    expect(content.toLowerCase()).not.toContain("wrapcoders");
    expect(content.toLowerCase()).not.toContain("wacrm");
    expect(content.toLowerCase()).not.toContain("envato");
    expect(content.toLowerCase()).not.toContain("codecanyon");
  });

  it("should have CYLOO CRM branding in package.json", () => {
    const pkgPath = resolve(ROOT, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

    expect(pkg.name).toBe("cyloo-crm");
    expect(pkg.author).toBe("CYLOO");
    expect(pkg.homepage).toContain("cyloo");

    // Verify no legacy branding
    const pkgStr = JSON.stringify(pkg).toLowerCase();
    expect(pkgStr).not.toContain("wrapcoders");
    expect(pkgStr).not.toContain("wacrm");
    expect(pkgStr).not.toContain("envato");
  });

  it("should not have legacy brand references in HTML files", () => {
    const htmlFiles = [
      "docs/index.html",
      "docs/status.html",
      "docs/support.html",
      "docs/changelog.html",
    ];

    for (const relPath of htmlFiles) {
      const fullPath = resolve(ROOT, relPath);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf-8").toLowerCase();
      expect(content).not.toContain("wrapcoders");
      expect(content).not.toContain("wacrm");
      expect(content).not.toContain("envato");
      expect(content).not.toContain("codecanyon");
      expect(content).not.toContain("md. ruhul hasan swapan");
    }
  });
});

describe("License Compliance", () => {
  it("should not contain Envato Extended License language", () => {
    const licensePath = resolve(ROOT, "LICENSE");
    const content = readFileSync(licensePath, "utf-8").toLowerCase();

    expect(content).not.toContain("envato");
    expect(content).not.toContain("extended license");
    expect(content).not.toContain("regular license");
    expect(content).not.toContain("codecanyon");
    expect(content).not.toContain("themeforest");
  });

  it("should have MIT license identifier", () => {
    const licensePath = resolve(ROOT, "LICENSE");
    const content = readFileSync(licensePath, "utf-8");
    expect(content).toContain("MIT License");
  });
});

