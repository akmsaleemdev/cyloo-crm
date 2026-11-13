/** Validate configuration without logging secret values or contacting providers. */
export function validatePublicEnvironment(env) {
  const errors = [];
  for (const [name, value] of Object.entries(env)) {
    if (!/^(?:VITE_|EXPO_PUBLIC_)|^SUPABASE_PUBLISHABLE_KEY$/.test(name) || !value) continue;
    let privileged = value.startsWith("sb_secret_");
    try {
      const claims = JSON.parse(
        Buffer.from(value.split(".")[1] ?? "", "base64url").toString("utf8"),
      );
      privileged ||= claims.role === "service_role";
    } catch {
      /* A public key need not be a JWT. */
    }
    if (privileged || /SERVICE_ROLE|PRIVATE_KEY|CLIENT_SECRET|SIGNING_SECRET/.test(name)) {
      errors.push(`${name} must not expose a server credential`);
    }
  }
  return errors;
}

export function validateProductionEnvironment(env) {
  const errors = [];
  for (const name of [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "APP_ORIGIN",
  ]) {
    if (!env[name]?.trim()) errors.push(`${name} is required`);
  }
  for (const name of ["SUPABASE_URL", "APP_ORIGIN"]) {
    if (!env[name]) continue;
    try {
      const url = new URL(env[name]);
      if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
        errors.push(`${name} must be an HTTPS URL without credentials, query or fragment`);
      }
      if (name === "APP_ORIGIN" && url.pathname !== "/")
        errors.push("APP_ORIGIN must contain only an origin");
    } catch {
      errors.push(`${name} must be a valid URL`);
    }
  }
  errors.push(...validatePublicEnvironment(env));
  if (env.SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_secret_")) {
    errors.push("SUPABASE_PUBLISHABLE_KEY must be a public key");
  }
  if (
    env.SUPABASE_SERVICE_ROLE_KEY &&
    env.SUPABASE_SERVICE_ROLE_KEY === env.SUPABASE_PUBLISHABLE_KEY
  ) {
    errors.push("Supabase public and server keys must be different");
  }
  if (
    env.APP_USER_CONNECTION_KEY_SECRET &&
    Buffer.from(env.APP_USER_CONNECTION_KEY_SECRET, "base64").length !== 32
  ) {
    errors.push("APP_USER_CONNECTION_KEY_SECRET must encode 32 bytes in base64");
  }
  if (env.RLS_TEST_HARNESS_SECRET || env.RLS_TEST_HARNESS_ALLOW_PROD === "1") {
    errors.push("The RLS mutation harness must be disabled in production");
  }
  return errors;
}
