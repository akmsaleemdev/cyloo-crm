/** Run the complete build lifecycle for the Cloudflare target. */
import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli)
  throw new Error(
    "Run the Cloudflare build with `npm run build:cloudflare` or `bun run build:cloudflare`.",
  );

// Calling Vite directly skips public-environment checks, SSR fixes and docs.
const isJavaScriptCli = /\.(?:c?js|mjs)$/i.test(npmCli);
const command = isJavaScriptCli ? process.execPath : npmCli;
const args = isJavaScriptCli ? [npmCli, "run", "build"] : ["run", "build"];
const build = spawnSync(command, args, {
  env: { ...process.env, NITRO_PRESET: "cloudflare-module" },
  stdio: "inherit",
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);
