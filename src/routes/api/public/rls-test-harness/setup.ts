import { createFileRoute } from "@tanstack/react-router";
/**
 * RLS cross-org test harness — SETUP.
 *
 * Creates two ephemeral auth users, each owning a fresh workspace + organization,
 * and returns credentials + access tokens for both.
 *
 * SECURITY:
 * - Gated by a 32+-byte RLS_TEST_HARNESS_SECRET (header `x-harness-secret`).
 * - Refuses all production requests; requires an explicitly isolated Supabase test project.
 */
export const Route = createFileRoute("/api/public/rls-test-harness/setup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { guardHarnessRequest } = await import("./server/harness.server");
        const denied = guardHarnessRequest(request);
        if (denied) return denied;

        try {
          // Dynamic import to keep service role logic out of client bundle
          const { setupHarness } = await import("./server/setup.server");
          const result = await setupHarness();
          return json(result);
        } catch (err) {
          return json({ error: "setup_failed", message: "Internal harness error" }, 500);
        }
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
