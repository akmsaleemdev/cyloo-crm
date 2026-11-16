// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/demo/admin-write-guard.server", () => ({ supabaseAdmin: { rpc } }));
import { enforceAIRateLimit } from "@/lib/ai/rate-limiter.server";

describe("database-backed AI rate limits", () => {
  beforeEach(() => {
    rpc.mockReset();
  });
  it("uses the deployed RPC contract and accepts an allowed result", async () => {
    rpc.mockResolvedValue({ data: [{ allowed: true, remaining: 9 }], error: null });
    await expect(
      enforceAIRateLimit({ workspaceId: "workspace", limit: 10 }),
    ).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith("enforce_rate_limit", {
      _bucket_key: "ai:workspace:*:*:*",
      _limit: 10,
      _window_seconds: 60,
      _workspace_id: "workspace",
    });
  });
  it("rejects a denied result", async () => {
    rpc.mockResolvedValue({ data: [{ allowed: false, remaining: 0 }], error: null });
    await expect(enforceAIRateLimit({ workspaceId: "workspace", limit: 10 })).rejects.toMatchObject(
      { type: "rate_limit" },
    );
  });
  it.each([
    { data: null, error: { code: "PGRST202" } },
    { data: [], error: null },
    { data: false, error: null },
    { data: [{ allowed: "true" }], error: null },
  ])("fails closed on RPC errors or malformed responses", async (result) => {
    rpc.mockResolvedValue(result);
    await expect(enforceAIRateLimit({ workspaceId: "workspace", limit: 10 })).rejects.toMatchObject(
      { type: "server" },
    );
  });
  it("fails closed on a network failure", async () => {
    rpc.mockRejectedValue(new Error("network"));
    await expect(enforceAIRateLimit({ workspaceId: "workspace", limit: 10 })).rejects.toMatchObject(
      { type: "server" },
    );
  });
});
