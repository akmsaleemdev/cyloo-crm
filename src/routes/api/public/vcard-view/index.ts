import { createFileRoute } from "@tanstack/react-router";

/**
 * Staged replacement for direct browser writes to public.vcard_views.
 * Disabled by default. Do not enable until client integration and analytics
 * counter migration are verified in an isolated project.
 */
export const Route = createFileRoute("/api/public/vcard-view/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (process.env.VCARD_VIEW_API_ENABLED !== "true") return reply(503, "unavailable");
        const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
        if (type !== "application/json") return reply(415, "unsupported_media_type");
        const length = Number(request.headers.get("content-length") ?? "0");
        if (!Number.isFinite(length) || length > 512) return reply(413, "payload_too_large");

        let body: unknown;
        try {
          const raw = await request.text();
          if (raw.length > 512) return reply(413, "payload_too_large");
          body = JSON.parse(raw);
        } catch {
          return reply(400, "invalid_request");
        }
        const id =
          typeof body === "object" && body !== null && !Array.isArray(body)
            ? (body as Record<string, unknown>).vcard_id
            : undefined;

        try {
          const { trackPublicVCardView } = await import("./server/track-view.server");
          const outcome = await trackPublicVCardView(id, request);
          if (outcome === "invalid") return reply(400, "invalid_request");
          if (outcome === "disabled") return reply(503, "unavailable");
          if (outcome === "failed") return reply(503, "unavailable");
          // Do not reveal whether a private/revoked card exists.
          return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
        } catch {
          return reply(503, "unavailable");
        }
      },
    },
  },
});

function reply(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
