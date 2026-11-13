// @vitest-environment node
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Cloudflare build lifecycle", () => {
  it("runs the full npm build lifecycle with the Worker preset", () => {
    const directory = mkdtempSync(join(tmpdir(), "cyloo-cloudflare-"));
    try {
      const npmCli = join(directory, "npm.cjs");
      writeFileSync(
        npmCli,
        "console.log(JSON.stringify({ args: process.argv.slice(2), preset: process.env.NITRO_PRESET }));",
      );
      const output = execFileSync(process.execPath, [resolve("scripts/build-cloudflare.mjs")], {
        env: { ...process.env, npm_execpath: npmCli, NITRO_PRESET: "node-server" },
        encoding: "utf8",
      });
      expect(JSON.parse(output)).toEqual({ args: ["run", "build"], preset: "cloudflare-module" });

      writeFileSync(npmCli, "process.exit(7);");
      const failed = spawnSync(process.execPath, [resolve("scripts/build-cloudflare.mjs")], {
        env: { ...process.env, npm_execpath: npmCli },
      });
      expect(failed.status).toBe(7);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rebuilds before deployment and lets npm stop on build failure", () => {
    const { scripts } = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
    expect(scripts["predeploy:cloudflare"]).toBe("npm run build:cloudflare");
    expect(scripts["deploy:cloudflare"]).toBe("node scripts/deploy-cloudflare.mjs");
  });
});
