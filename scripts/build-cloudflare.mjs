/** Run the complete build lifecycle for the Cloudflare target. */
import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run the Cloudflare build with `npm run build:cloudflare`.");

// Calling Vite directly skips public-environment checks, SSR fixes and docs.
const build = spawnSync(process.execPath, [npmCli, "run", "build"], {
  env: { ...process.env, NITRO_PRESET: "cloudflare-module" },
  stdio: "inherit",
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);
