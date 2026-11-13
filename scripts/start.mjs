import { validateProductionEnvironment } from "./lib/environment.mjs";

process.env.NODE_ENV ??= "production";
const errors = validateProductionEnvironment(process.env);
if (errors.length) {
  console.error(
    `Invalid runtime configuration:\n${errors.map((message) => `- ${message}`).join("\n")}`,
  );
  process.exit(1);
}
await import("../.output/server/index.mjs");
