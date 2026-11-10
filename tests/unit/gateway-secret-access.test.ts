/**
 * ============================================================================
 * CYLOO CRM — Unit Tests: Gateway Secret Access
 * ============================================================================
 *
 * Validates that payment gateway and webhook secrets are not accessible
 * through client-side code or exposed in public bundles.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve, extname } from "node:path";

const SRC_DIR = resolve(__dirname, "../../src");

function isServerModule(filePath: string): boolean {
  return (
    filePath.includes(".server.") ||
    filePath.includes("/server/") ||
    filePath.includes("\\server\\") ||
    filePath.includes(".functions.") ||
    filePath.includes("/providers/") ||
    filePath.includes("\\providers\\") ||
    filePath.endsWith(".server.ts")
  );
}

function walkDir(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".output") continue;
        results.push(...walkDir(fullPath, extensions));
      } else if (extensions.includes(extname(entry.name))) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return results;
}

describe("Gateway Secret Access", () => {
  // ─── Pure Client UI components should not reference secrets ──────

  it("should not expose SUPABASE_SERVICE_ROLE_KEY in pure UI components", () => {
    const uiFiles = walkDir(join(SRC_DIR, "components"), [".tsx", ".ts"]);

    for (const file of uiFiles) {
      const content = readFileSync(file, "utf-8");
      const hasServiceKey =
        content.includes("SUPABASE_SERVICE_ROLE_KEY") ||
        content.includes("service_role_key");

      expect(
        hasServiceKey,
        `UI component "${file}" directly references service role key`,
      ).toBe(false);
    }
  });

  it("should confine secret environment variables to server-side modules", () => {
    const allTsFiles = walkDir(SRC_DIR, [".ts", ".tsx"]);

    const secretPatterns = [
      "process.env.SUPABASE_SERVICE_ROLE_KEY",
      "process.env.STRIPE_SECRET_KEY",
      "process.env.PAYMENT_WEBHOOK_SECRET",
    ];

    for (const file of allTsFiles) {
      const content = readFileSync(file, "utf-8");
      for (const pattern of secretPatterns) {
        if (content.includes(pattern)) {
          const isServer = isServerModule(file);
          expect(
            isServer,
            `Secret access "${pattern}" in non-server module: ${file}`,
          ).toBe(true);
        }
      }
    }
  });

  it(
    "should not hardcode API keys or secrets in source files",
    () => {
      // Focus on lib, server, routes, and config directories
      const targetDirs = [
        join(SRC_DIR, "lib"),
        join(SRC_DIR, "server"),
        join(SRC_DIR, "config"),
      ];
      const targetFiles = targetDirs.flatMap((dir) =>
        walkDir(dir, [".ts", ".tsx"]),
      );

      const secretRegexes = [
        /sk_live_[a-zA-Z0-9]{20,}/,
        /whsec_[a-zA-Z0-9]{20,}/,
      ];

      for (const file of targetFiles) {
        const content = readFileSync(file, "utf-8");
        for (const regex of secretRegexes) {
          expect(
            regex.test(content),
            `Potential hardcoded secret in ${file} matching ${regex}`,
          ).toBe(false);
        }
      }
    },
    30_000,
  );
});
