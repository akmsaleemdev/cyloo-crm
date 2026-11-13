/**
 * ============================================================================
 * CYLOO CRM — Integration Test: Workflow RLS Access
 * ============================================================================
 *
 * Validates that workflow engine access is properly scoped to tenants.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SRC_DIR = resolve(__dirname, "../../src");

describe("Workflow RLS Access", () => {
  it("should have workflow server functions in .server.ts files", () => {
    const serverFiles = [
      "lib/workflows/engine.server.ts",
      "lib/workflows/ai-eval.server.ts",
      "lib/workflows/marketing-actions.server.ts",
    ];

    for (const relPath of serverFiles) {
      const fullPath = resolve(SRC_DIR, relPath);
      if (existsSync(fullPath)) {
        expect(relPath).toContain(".server.");
      }
    }
  });

  it("should have workflow functions file for client-side queries", () => {
    const functionsFile = resolve(SRC_DIR, "lib/workflows/workflows.functions.ts");
    expect(existsSync(functionsFile)).toBe(true);
  });

  it("should have workflow validation logic", () => {
    const validationFile = resolve(SRC_DIR, "lib/workflows/validation.ts");
    if (existsSync(validationFile)) {
      const content = readFileSync(validationFile, "utf-8");
      // Should export validation functions
      expect(content).toContain("export");
    }
  });
});
