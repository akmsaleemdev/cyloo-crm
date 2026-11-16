// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

// Exercise the actual consumer of the scoped minimatch security override.
const require = createRequire(import.meta.url);
const parser = require("@typescript-eslint/typescript-estree") as {
  clearCaches: () => void;
  parseAndGenerateServices: (
    source: string,
    options: Record<string, unknown>,
  ) => {
    services: { program?: unknown };
  };
};
let root: string;
beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), "cyloo-parser-security-"));
  mkdirSync(path.join(root, "src"));
  mkdirSync(path.join(root, "nested"));
  writeFileSync(path.join(root, "src", "included.ts"), "export const included = true;");
  writeFileSync(
    path.join(root, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { strict: true }, include: ["src/**/*.ts"] }),
  );
});
afterAll(() => {
  parser.clearCaches();
  rmSync(root, { recursive: true, force: true });
});
function parse(file: string) {
  const source = "export const value = 1;";
  writeFileSync(path.join(root, file), source);
  return parser.parseAndGenerateServices(source, {
    filePath: path.join(root, file),
    tsconfigRootDir: root,
    projectService: { allowDefaultProject: ["*.ts"], defaultProject: "tsconfig.json" },
  });
}
describe("TypeScript ESLint matcher override", () => {
  it("permits configured top-level and dot files", () => {
    expect(parse("allowed.ts").services.program).toBeDefined();
    expect(parse(".hidden.ts").services.program).toBeDefined();
  }, 30_000);
  it("still excludes nested files from the configured allowlist", () => {
    expect(() => parse("nested/blocked.ts")).toThrow(/not.*found|allowDefaultProject/i);
  });
});
