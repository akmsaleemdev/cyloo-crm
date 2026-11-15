import { createFileRoute } from "@tanstack/react-router";
import { guardCronRequest } from "@/lib/api/request-guards";

/**
 * Daily birthday reminder cron endpoint.
 *
 * Called by pg_cron via net.http_post. `/api/public/*` bypasses auth on
 * published sites; we authenticate the caller with the private
 * `x-cron-token` header matching INTERNAL_CRON_TOKEN.
 */
export const Route = createFileRoute("/api/public/hooks/birthday-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = guardCronRequest(request);
        if (denied) return denied;
        try {
          const { runBirthdayReminders } = await import("@/lib/birthday/reminders-runner.server");
          const result = await runBirthdayReminders();
          return Response.json({ ok: true, ...result });
        } catch (error: unknown) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
