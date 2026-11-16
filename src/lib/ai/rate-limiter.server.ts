/**
 * Ad-hoc AI rate limiter, layered on the existing `enforce_rate_limit` RPC
 * that the security phase introduced. Buckets are per-workspace / per-user /
 * per-provider so heavy features cannot starve everyone else.
 */
import { AIError } from "./errors";
import { sbAny } from "@/lib/supabase/untyped";

export interface AIRateLimit {
  workspaceId: string;
  userId?: string | null;
  providerId?: string | null;
  feature?: string | null;
  /** requests per minute */
  limit: number;
}

export async function enforceAIRateLimit(rl: AIRateLimit): Promise<void> {
  if (!rl.limit || rl.limit <= 0) return;
  const bucketKey = [
    "ai",
    rl.workspaceId,
    rl.providerId ?? "*",
    rl.userId ?? "*",
    rl.feature ?? "*",
  ].join(":");

  try {
    const { supabaseAdmin } = await import("@/lib/demo/admin-write-guard.server");
    const { data, error } = await sbAny(supabaseAdmin).rpc(
      "enforce_rate_limit" as never,
      {
        _bucket_key: bucketKey,
        _limit: rl.limit,
        _window_seconds: 60,
        _workspace_id: rl.workspaceId,
      } as never,
    );
    const result = Array.isArray(data) ? data[0] : null;
    if (error || !result || typeof result.allowed !== "boolean") {
      throw new AIError("server", "AI rate limit verification is unavailable", { retryable: true });
    }
    if (!result.allowed) {
      throw new AIError("rate_limit", `Rate limit exceeded (${rl.limit}/min)`, { retryable: true });
    }
  } catch (e) {
    if (e instanceof AIError) throw e;
    throw new AIError("server", "AI rate limit verification is unavailable", { retryable: true });
  }
}
