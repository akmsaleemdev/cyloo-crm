/**
 * Platform-wide default VAT rate for NEW sales documents only.
 * A default never overrides saved line-item tax or a document's historical totals.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPlatformTaxDefaults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/lib/demo/admin-write-guard.server");
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("scope", "platform")
      .eq("key", "billing")
      .is("organization_id", null)
      .is("workspace_id", null)
      .is("user_id", null)
      .maybeSingle();
    if (error) throw new Error("Unable to load the platform VAT default");
    const value = data?.value;
    const settings = value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown> : {};
    const validRate = (input: unknown): number | null =>
      typeof input === "number" && Number.isFinite(input) && input >= 0 && input <= 100
        ? input : null;
    return {
      vatRate: validRate(settings.default_vat_rate),
      gstRate: validRate(settings.default_gst_rate),
    };
  });
