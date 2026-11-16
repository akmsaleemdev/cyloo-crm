import { isServerDemoMode } from "@/lib/demo/mode.server";
import { supabaseAdmin } from "@/lib/demo/admin-write-guard.server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Disabled-by-default server-side vCard tracking.
 *
 * The privileged database RPC checks visibility/revocation, inserts the view,
 * observes the existing shared rate-limit trigger, and increments the counter
 * in a single transaction. Visitor-specific throttling is pending. Do not
 * enable this endpoint until the full rollout has passed integration tests.
 */
export async function trackPublicVCardView(
  id: unknown,
  request: Request,
): Promise<"disabled" | "invalid" | "not_found" | "recorded" | "throttled" | "failed"> {
  if (process.env.VCARD_VIEW_API_ENABLED !== "true" || isServerDemoMode()) return "disabled";
  if (typeof id !== "string" || !UUID_RE.test(id)) return "invalid";

  // Only server-selected fields are forwarded. Public callers cannot specify
  // an organization, workspace, SQL function, or user identity.
  const referrer = request.headers.get("referer")?.slice(0, 2048) || null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) || null;

  // The RPC has EXECUTE granted only to service_role; its SQL body performs
  // the authoritative checks while holding a row lock.
  const { data, error } = await supabaseAdmin.rpc(
    "record_public_vcard_view" as never,
    {
      _vcard_id: id,
      _referrer: referrer,
      _user_agent: userAgent,
    } as never,
  );

  if (error) return "failed";
  if (data === "recorded" || data === "not_found" || data === "throttled") return data;
  return "failed";
}
