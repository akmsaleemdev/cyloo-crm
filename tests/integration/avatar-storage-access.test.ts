/**
 * ============================================================================
 * CYLOO CRM — Integration Test: Avatar Storage Access
 * ============================================================================
 *
 * Validates that storage bucket access for avatars and file attachments
 * follows proper authorization patterns.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC_DIR = resolve(__dirname, "../../src");

describe("Avatar Storage Access", () => {
  it("should have storage bucket configuration", () => {
    const bucketsPath = resolve(SRC_DIR, "lib/storage/buckets.ts");
    expect(existsSync(bucketsPath)).toBe(true);

    if (existsSync(bucketsPath)) {
      const content = readFileSync(bucketsPath, "utf-8");
      // Should define bucket names as constants
      expect(content).toContain("avatar");
    }
  });

  it("should not expose storage service role in client components", () => {
    const storageFiles = [
      "lib/storage/active-user.ts",
      "lib/storage/buckets.ts",
      "lib/storage/org-storage-migration.ts",
    ];

    for (const relPath of storageFiles) {
      const fullPath = resolve(SRC_DIR, relPath);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, "utf-8");
        // Client-side storage access should NOT use service_role
        expect(content).not.toContain("service_role_key");
        expect(content).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      }
    }
  });
});

