import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.(?:tsx?|[cm]?js|json|html|svg|css)$/.test(entry.name)
        ? [path]
        : [];
  });
}

describe("Platform independence", () => {
  it("keeps public-registry lockfiles free of builder cache routing", () => {
    for (const path of ["bun.lock", "mobile/bun.lock", "package-lock.json"]) {
      expect(read(path), path).not.toMatch(/lovable-core-prod|sandbox-npm-cache|lovable-tagger/i);
    }
  });

  it("keeps all application manifests free of builder-specific SDKs", () => {
    for (const path of ["package.json", "mobile/package.json", "qr-worker/package.json"]) {
      const manifest = JSON.parse(read(path));
      expect(
        Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).join("\n"),
      ).not.toMatch(/lovable|monday-sdk|@replit|@codesandbox/i);
    }
  });

  it("does not ship external builder or Monday resources in runtime source and assets", () => {
    for (const directory of ["src", "public", "mobile/src", "qr-worker/src"]) {
      for (const file of sourceFiles(resolve(root, directory))) {
        expect(readFileSync(file, "utf8"), file).not.toMatch(
          /https?:\/\/[^\s"'<>`]*(?:lovable\.(?:dev|app)|monday\.com|bolt\.new|replit\.com|v0\.dev|codesandbox\.io|stackblitz\.com)/i,
        );
      }
    }
  });
});
