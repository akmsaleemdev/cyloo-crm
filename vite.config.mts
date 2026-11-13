import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";

// Keep existing deployment targets; use a standalone Node server by default.
const explicitPreset = process.env.NITRO_PRESET || (process.env.VERCEL ? "vercel" : undefined);
const nodeMiddleware =
  process.env.DEPLOY_TARGET === "node" ||
  explicitPreset === "node-middleware" ||
  explicitPreset === "node";
const preset = nodeMiddleware
  ? "node-middleware"
  : explicitPreset || (process.env.NETLIFY === "true" ? "netlify" : "node-server");

// Stamp the built artifact itself: runtime environments often omit APP_COMMIT.
let buildCommit = process.env.APP_COMMIT || process.env.GITHUB_SHA || "unknown";
if (buildCommit === "unknown") {
  try {
    buildCommit = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
    const changed = execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
    if (changed) buildCommit += "-dirty";
  } catch {
    // Source archives can supply APP_COMMIT instead of a Git checkout.
  }
}
const buildTime = new Date().toISOString();

export default defineConfig(({ command }) => ({
  base: process.env.PUBLIC_BASE_URL || "/",
  define: {
    "import.meta.env.VITE_BUILD_COMMIT": JSON.stringify(buildCommit),
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(buildTime),
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"],
  },
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      router: { routeFileIgnorePattern: "\\.server\\." },
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      server: {
        entry: "server",
        ...(nodeMiddleware ? { preset: "node-middleware" as const } : {}),
      },
    }),
    ...(command === "build"
      ? [
          nitro({
            preset,
            routeRules: {
              "/sw.js": { headers: { "cache-control": "no-cache, max-age=0, must-revalidate" } },
            },
            ...(preset === "netlify" ? { noExternals: ["tslib"] } : {}),
          }),
        ]
      : []),
    react(),
  ],
}));
