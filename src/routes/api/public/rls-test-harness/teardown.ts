import { createFileRoute } from "@tanstack/react-router";
/**
 * RLS cross-org test harness — TEARDOWN.
 * Deletes the ephemeral users; owned workspaces/orgs cascade.
 */
export const Route = createFileRoute("/api/public/rls-test-harness/teardown")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { guardHarnessRequest } = await import("./server/harness.server");
        const denied = guardHarnessRequest(request);
        if (denied) return denied;

        let body: { user_ids?: string[] } = {};
        try {
          body = await request.json();
        } catch {
          // no-op
        }

        try {
          const { teardownHarness } = await import("./server/teardown.server");
          const result = await teardownHarness(body.user_ids ?? []);
          return json(result);
        } catch (err) {
          return json({ error: "teardown_failed", message: "Internal harness error" }, 500);
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
