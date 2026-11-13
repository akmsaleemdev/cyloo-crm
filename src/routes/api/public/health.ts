import { createFileRoute } from "@tanstack/react-router";
import { APP_RELEASE_CHANNEL, APP_VERSION } from "@/lib/app-version";

/**
 * Public health-check endpoint for load balancers, uptime monitors,
 * and container orchestrators. Returns 200 with lightweight runtime info.
 * Do NOT add DB round-trips here — this must stay fast and dependency-free.
 * For deep checks, use /api/public/health/ready.
 */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(
          JSON.stringify({
            status: "ok",
            service: "web",
            // Application release version (source of truth: src/lib/app-version.ts).
            // APP_VERSION env var wins when a build stamps a different value.
            version: process.env["APP_VERSION"] ?? APP_VERSION,
            app_version: APP_VERSION,
            release_channel: APP_RELEASE_CHANNEL,
            commit: import.meta.env.VITE_BUILD_COMMIT ?? process.env["APP_COMMIT"] ?? "unknown",
            built_at: import.meta.env.VITE_BUILD_TIME ?? null,
            timestamp: new Date().toISOString(),
            uptime_s: Math.round(process.uptime?.() ?? 0),
          }),

          {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          },
        );
      },
    },
  },
});
