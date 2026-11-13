#!/usr/bin/env node
/**
 * One-shot rebrand codemod: CYLOO / CYLOO -> CYLOO.
 *
 * Lineage: wadiff -> swiffer -> cyloo -> cyloo. Earlier passes (wadiff and
 * swiffer) intentionally remain untouched — they are "retired brand" needles
 * enforced by scripts/check-outbound-branding.mjs and
 * scripts/verify-rebrand-db.mjs, plus historical record.
 *
 * Replacement order matters:
 *   1. Compound legacy domains first (demo.cyloo.ai,
 *      cyloo.com) so the generic passes cannot split them.
 *   2. Then branded domains (cyloo.ai -> cyloo.ai, cyloo.ai -> cyloo.ai).
 *   3. Then the bare case variants (CYLOO, cyloo, Cyloo, CYLOO, ...).
 *
 * NOT touched:
 *   - supabase/migrations/** (applied migration history is never rewritten;
 *     the cyloo -> cyloo database rename lives in its own forward migration)
 *   - LICENSE (MIT copyright notice must be preserved verbatim)
 *   - .env / .env.local / .env.production.local (secrets — never rewritten)
 *   - lockfiles, archives, build output, dependency dirs
 *
 * Idempotent: on a rebranded tree every pass matches nothing and the script
 * reports zero changes. Usage:
 *   node scripts/rebrand-cyloo.mjs            # apply
 *   node scripts/rebrand-cyloo.mjs --dry-run  # report only
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep, extname } from "node:path";

const ROOT = process.cwd();
const DRY = process.argv.includes("--dry-run");

/** Domain-level replacements, applied before the bare brand terms. */
const DOMAIN_MAP = [
  ["demo.cyloo.ai", "demo.cyloo.ai"],
  ["cyloo", "cyloo"],
  ["cyloo.ai", "cyloo.ai"],
  ["cyloo.ai", "cyloo.ai"],
  ["cyloo.ai", "cyloo.ai"],
];

/** Case-variant term replacements, applied after the domain map. */
const TERM_MAP = [
  ["CYLOO", "CYLOO"],
  ["Cyloo", "Cyloo"],
  ["cyloo", "cyloo"],
  ["CYLOO", "CYLOO"],
  ["Cyloo", "Cyloo"],
  ["cyloo", "cyloo"],
];

const REPLACEMENTS = [...DOMAIN_MAP, ...TERM_MAP];

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".mimosa",
  "dist",
  "build",
  ".output",
  ".vinxi",
  "coverage",
  "playwright-report",
  "test-results",
  ".turbo",
  ".next",
  "supabase", // handled below: only functions/ + config, never migrations/
]);

const SKIP_FILES = new Set([
  "LICENSE",
  "DoniaWeB.txt",
  "package-lock.json",
  "bun.lock",
  "bun.lockb",
  ".env",
  ".env.local",
  ".env.production.local",
  "routeTree.gen.ts",
]);

const TEXT_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".mdx",
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".svg",
  ".txt",
  ".webmanifest",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".sql",
  ".sh",
  ".ps1",
  ".xml",
  ".ics",
  ".env",
  ".gitignore",
  ".npmrc",
  ".prettierrc",
  ".prettierignore",
  ".dockerignore",
]);

const ROOT_FILES = [
  "package.json",
  "netlify.toml",
  "Dockerfile",
  "Dockerfile.dev",
  "docker-compose.yml",
  "docker-compose.dev.yml",
  "docker-compose.staging.yml",
  "app.js",
  "app.cjs",
  "vite.config.mts",
  "playwright.config.ts",
  "eslint.config.mjs",
  "bunfig.toml",
  "components.json",
  "tsconfig.json",
  "tsconfig.project-management.json",
  "vitest.config.ts",
  "vitest.inbox-focused.config.ts",
  "vitest.rls.config.ts",
  ".env.example",
  ".gitignore",
  ".prettierignore",
  ".prettierrc",
  ".dockerignore",
  ".npmrc",
];

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".env")) continue; // never rewrite secret files
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

function collectFiles() {
  const files = [];
  // Source trees — everything except supabase/migrations (history untouched).
  for (const top of ["src", "scripts", "public", "docs", "mobile", "qr-worker"]) {
    const dir = join(ROOT, top);
    try {
      statSync(dir);
    } catch {
      continue;
    }
    for (const f of walk(dir)) {
      files.push(f);
    }
  }
  // supabase: functions/ + config.toml only (migrations are history).
  for (const sub of ["supabase/functions", "supabase/config.toml"]) {
    const p = join(ROOT, sub);
    try {
      const st = statSync(p);
      if (st.isFile()) files.push(p);
      else for (const f of walk(p)) files.push(f);
    } catch {
      /* absent */
    }
  }
  for (const f of ROOT_FILES) {
    try {
      statSync(join(ROOT, f));
      files.push(join(ROOT, f));
    } catch {
      /* absent */
    }
  }
  return files;
}

const changed = [];
const skippedBinary = [];

for (const file of collectFiles()) {
  const ext = extname(file).toLowerCase();
  const isDotfile = /(^|[\\/])\.[^\\/]+$/.test(file);
  if (!TEXT_EXTS.has(ext) && !isDotfile && ext !== "") {
    skippedBinary.push(relative(ROOT, file));
    continue;
  }
  if (SKIP_FILES.has(file.split(sep).pop())) continue;

  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue; // unreadable (binary-ish) — leave untouched
  }
  // Quick reject: skip decode/encode round-trip on clean files.
  const lower = content.toLowerCase();
  if (!lower.includes("cyloo") && !lower.includes("cyloo")) continue;

  let next = content;
  for (const [from, to] of REPLACEMENTS) next = next.split(from).join(to);

  if (next !== content) {
    if (!DRY) writeFileSync(file, next, "utf8");
    changed.push(relative(ROOT, file));
  }
}

console.log(`mode: ${DRY ? "DRY-RUN" : "APPLY"}`);
console.log(`files changed: ${changed.length}`);
for (const f of changed) console.log(`  ~ ${f}`);
console.log(`binary/untouched skipped: ${skippedBinary.length}`);
if (changed.length === 0) console.log("Nothing to rebrand — tree is already CYLOO.");
