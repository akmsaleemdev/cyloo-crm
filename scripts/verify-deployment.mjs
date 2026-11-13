import { parseArgs } from "node:util";
import { verifyDeployment } from "./lib/deployment-verification.mjs";

const { values, positionals } = parseArgs({
  options: { commit: { type: "string" } },
  allowPositionals: true,
});
try {
  if (positionals.length !== 1)
    throw new Error("Usage: npm run verify:deployment -- https://HOST --commit ARTIFACT_COMMIT");
  const data = await verifyDeployment({ origin: positionals[0], commit: values.commit });
  console.log(`Verified ${positionals[0]}: ${data.commit}, built ${data.built_at}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
