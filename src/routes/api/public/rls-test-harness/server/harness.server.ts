import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import type { Database } from "@/integrations/supabase/types";

/**
 * Reject all harness access in production, even if a legacy allow-prod flag exists.
 * Require an explicitly designated isolated Supabase test project and a long
 * secret; a development server pointed at production must never be sufficient.
 */
export function guardHarnessRequest(request: Request): Response | null {
  const deny = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), {
      status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });

  const mode = process.env.APP_MODE ?? process.env.VITE_APP_MODE;
  if (process.env.NODE_ENV === "production" || mode === "production") {
    return deny(403, "harness_unavailable");
  }
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const testUrl = process.env.SUPABASE_TEST_URL?.replace(/\/$/, "");
  if (process.env.RLS_TEST_ENVIRONMENT !== "isolated" || !url || !testUrl || url !== testUrl) {
    return deny(503, "harness_disabled");
  }

  const secret = process.env.RLS_TEST_HARNESS_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) return deny(503, "harness_disabled");
  const supplied = request.headers.get("x-harness-secret") ?? "";
  const expected = Buffer.from(secret);
  const received = Buffer.from(supplied);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return deny(401, "unauthorized");
  }
  return null;
}

/**
 * Privileged client for RLS test harness.
 * Only ever imported by .server.ts files.
 */
export function getHarnessAdmin() {
  if (
    process.env.NODE_ENV === "production" ||
    (process.env.APP_MODE ?? process.env.VITE_APP_MODE) === "production" ||
    process.env.RLS_TEST_ENVIRONMENT !== "isolated" ||
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL.replace(/\/$/, "") !==
      process.env.SUPABASE_TEST_URL?.replace(/\/$/, "")
  ) {
    throw new Error("RLS harness requires an isolated, non-production test project");
  }
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !serviceKey || !publishableKey) {
    throw new Error("Missing Supabase configuration");
  }

  const admin = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { admin, url, serviceKey, publishableKey };
}
