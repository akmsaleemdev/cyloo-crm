import { isServerDemoMode } from "@/lib/demo/mode.server";
import { supabaseAdmin } from "@/lib/demo/admin-write-guard.server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * A staged server-side replacement for the anonymous PostgREST INSERT.
 *
 * This endpoint is opt-in until the client switch and database grants migration
 * can be deployed together. The existing database trigger still provides the
 * shared 120-views/minute-per-card cap. Visitor-specific throttling and an
 * atomic view_count update are NOT implemented in this initial patch.
 */
export async function trackPublicVCardView(
  id: unknown,
  request: Request,
): Promise<"disabled" | "invalid" | "not_found" | "recorded" | "failed"> {
  // Fail closed until server tracking, dashboard counting and grants are rolled out together.
  if (process.env.VCARD_VIEW_API_ENABLED !== "true" || isServerDemoMode()) return "disabled";
  if (typeof id !== "string" || !UUID_RE.test(id)) return "invalid";

  // This is privileged: never accept workspace IDs or arbitrary table data from visitors.
  const { data: card, error: lookupError } = await supabaseAdmin
    .from("vcards")
    .select("id, is_public, revoked_at")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) return "failed";
  if (!card || card.is_public !== true || card.revoked_at !== null) return "not_found";

  const referrer = request.headers.get("referer")?.slice(0, 2048) || null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) || null;
  const { error } = await supabaseAdmin.from("vcard_views").insert({
    vcard_id: id,
    referrer,
    user_agent: userAgent,
  });

  return error ? "failed" : "recorded";
}
