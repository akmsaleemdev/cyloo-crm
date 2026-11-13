import { describe, expect, it } from "vitest";
import {
  validateProductionEnvironment,
  validatePublicEnvironment,
} from "../../scripts/lib/environment.mjs";

const valid = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_example",
  APP_ORIGIN: "https://crm.example.com",
};

describe("Production environment boundaries", () => {
  it("checks build-time public variables without requiring server secrets", () => {
    expect(
      validatePublicEnvironment({ VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example" }),
    ).toEqual([]);
    expect(
      validatePublicEnvironment({ VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_example" }),
    ).toHaveLength(1);
    expect(validatePublicEnvironment({ EXPO_PUBLIC_CLIENT_SECRET: "example" })).toHaveLength(1);
  });
  it("permits configured Supabase with optional integrations disabled", () => {
    expect(validateProductionEnvironment(valid)).toEqual([]);
  });
  it("reports missing variable names without disclosing values", () => {
    expect(validateProductionEnvironment({})).toContain("SUPABASE_URL is required");
  });
  it("rejects privileged credentials in public configuration", () => {
    const token = `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signature`;
    for (const value of ["sb_secret_example", token]) {
      const errors = validateProductionEnvironment({
        ...valid,
        VITE_SUPABASE_PUBLISHABLE_KEY: value,
      });
      expect(errors).toContain("VITE_SUPABASE_PUBLISHABLE_KEY must not expose a server credential");
      expect(errors.join(" ")).not.toContain(value);
    }
  });
  it("rejects unsafe origins and production mutation harnesses", () => {
    expect(
      validateProductionEnvironment({
        ...valid,
        APP_ORIGIN: "http://crm.example.com",
        RLS_TEST_HARNESS_SECRET: "example",
      }),
    ).toHaveLength(2);
  });
  it("validates encryption keys and distinct public/server credentials", () => {
    expect(
      validateProductionEnvironment({
        ...valid,
        APP_USER_CONNECTION_KEY_SECRET: "invalid",
        SUPABASE_SERVICE_ROLE_KEY: valid.SUPABASE_PUBLISHABLE_KEY,
      }),
    ).toHaveLength(2);
  });
});
