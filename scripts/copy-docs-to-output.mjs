/**
 * Include the standalone documentation portal in Nitro's static asset output.
 * Wrangler uploads `.output/public`, so source files kept in `docs/` must be
 * copied there after every build.
 */
import { cp, mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve(process.cwd(), "docs");
const publicOutput = resolve(process.cwd(), ".output/public");
const destination = resolve(publicOutput, "docs");

const sourceStats = await stat(source).catch(() => null);
if (!sourceStats?.isDirectory()) {
  console.log(
    `[copy-docs-to-output] Documentation source directory not found: ${source}; skipping.`,
  );
  process.exit(0);
}

await mkdir(publicOutput, { recursive: true });
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });

console.log(`Copied documentation assets to ${destination}`);
