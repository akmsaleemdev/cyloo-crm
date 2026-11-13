import { loadEnv } from "vite";
import { validatePublicEnvironment } from "./lib/environment.mjs";

// Match the default production build's dotenv precedence, including shell overrides.
const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
const errors = validatePublicEnvironment(env);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Public environment credential boundaries passed.");
}
