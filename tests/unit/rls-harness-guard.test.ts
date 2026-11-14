import { afterEach, describe, expect, it, vi } from "vitest";
import { guardHarnessRequest, getHarnessAdmin } from "@/routes/api/public/rls-test-harness/server/harness.server";

const secret = "test-only-secret-".repeat(4);
const testUrl = "https://synthetic-rls-test.supabase.co";

afterEach(() => {
  vi.unstubAllEnvs();
});

function isolatedEnvironment() {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("APP_MODE", "development");
  vi.stubEnv("VITE_APP_MODE", "development");
  vi.stubEnv("RLS_TEST_ENVIRONMENT", "isolated");
  vi.stubEnv("SUPABASE_URL", testUrl);
  vi.stubEnv("SUPABASE_TEST_URL", testUrl);
  vi.stubEnv("RLS_TEST_HARNESS_SECRET", secret);
}

function request(value = secret) {
  return new Request("http://localhost/api/public/rls-test-harness/setup", {
    method: "POST",
    headers: { "x-harness-secret": value },
  });
}

describe("RLS harness isolation guard", () => {
  it("rejects production even when the legacy allow-production flag is set", () => {
    isolatedEnvironment();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RLS_TEST_HARNESS_ALLOW_PROD", "1");
    expect(guardHarnessRequest(request())?.status).toBe(403);
    expect(() => getHarnessAdmin()).toThrow(/isolated, non-production/);
  });

  it("rejects application production mode", () => {
    isolatedEnvironment();
    vi.stubEnv("APP_MODE", "production");
    expect(guardHarnessRequest(request())?.status).toBe(403);
  });

  it("rejects a missing isolation marker", () => {
    isolatedEnvironment();
    vi.stubEnv("RLS_TEST_ENVIRONMENT", "");
    expect(guardHarnessRequest(request())?.status).toBe(503);
  });

  it("rejects differing Supabase project URLs", () => {
    isolatedEnvironment();
    vi.stubEnv("SUPABASE_TEST_URL", "https://different.supabase.co");
    expect(guardHarnessRequest(request())?.status).toBe(503);
  });

  it("rejects missing, short and incorrect secrets", () => {
    isolatedEnvironment();
    expect(guardHarnessRequest(request("wrong"))?.status).toBe(401);
    vi.stubEnv("RLS_TEST_HARNESS_SECRET", "short");
    expect(guardHarnessRequest(request("short"))?.status).toBe(503);
  });

  it("allows only correctly authenticated requests for the isolated project", () => {
    isolatedEnvironment();
    expect(guardHarnessRequest(request())).toBeNull();
  });
});
