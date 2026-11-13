/**
 * Prepare an existing Bun lock for a version-preserving public-registry migration.
 * Usage: node scripts/prepare-public-lock-migration.mjs source.lock package.json output-dir
 *
 * Every exact version is looked up on npm; its integrity must match the original
 * lock. URLs are taken from verified registry metadata, never string-rewritten.
 * This writes only staging files. Run Bun there, compare package versions, then
 * adopt its generated bun.lock. Requires the repository's TypeScript parser.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import ts from "typescript";

const [source, manifestPath, destination] = process.argv.slice(2);
if (!source || !manifestPath || !destination) {
  throw new Error("Expected: source.lock package.json output-directory");
}
const parsed = ts.parseConfigFileTextToJson(source, await readFile(source, "utf8"));
if (parsed.error) throw new Error("Cannot parse the source Bun lock");
const original = parsed.config;
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const queue = Object.entries(original.packages);
const cache = new Map();

async function metadata(spec) {
  if (!cache.has(spec)) {
    cache.set(
      spec,
      (async () => {
        const at = spec.lastIndexOf("@");
        if (at <= 0) throw new Error(`Unsupported package spec: ${spec}`);
        const name = spec.slice(0, at);
        const version = spec.slice(at + 1);
        if (!/^\d+\.\d+\.\d+/.test(version)) throw new Error(`Not an npm version: ${spec}`);
        const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error(`Registry returned ${response.status} for ${spec}`);
        const info = await response.json();
        if (info.name !== name || info.version !== version)
          throw new Error(`Registry identity mismatch: ${spec}`);
        const tarball = new URL(info.dist.tarball);
        if (tarball.protocol !== "https:" || tarball.hostname !== "registry.npmjs.org") {
          throw new Error(`Nonpublic tarball metadata: ${spec}`);
        }
        return info;
      })(),
    );
  }
  return cache.get(spec);
}

await Promise.all(
  Array.from({ length: 12 }, async () => {
    while (queue.length) {
      const [key, entry] = queue.shift();
      const info = await metadata(entry[0]);
      const integrity = entry[3];
      if (!integrity || info.dist.integrity !== integrity) {
        throw new Error(`Public registry integrity differs from the checkpoint: ${entry[0]}`);
      }
      // Adopt only the URL provided by npm after exact identity + integrity checks.
      // All dependency edges, versions and integrity hashes remain unchanged.
      original.packages[key][1] = info.dist.tarball;
    }
  }),
);

const output = resolve(destination);
await mkdir(output, { recursive: true });
original.workspaces[""].name = manifest.name;
await writeFile(join(output, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(join(output, "bun.lock"), `${JSON.stringify(original, null, 2)}\n`);
console.log(
  `Verified public registry identity and integrity for ${cache.size} exact versions; preserved ${Object.keys(original.packages).length} package paths. Run Bun to regenerate the staged lock.`,
);
