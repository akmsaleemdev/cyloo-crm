import { expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    middleware: () => ({ handler: (handler: unknown) => handler }),
  }),
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));

it("denies a non-admin before querying readiness data", async () => {
  const { getExtensionReadiness } = await import("@/lib/plugins/readiness.functions");
  const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
  const from = vi.fn();
  const handler = getExtensionReadiness as unknown as (args: {
    context: { supabase: unknown; userId: string };
  }) => Promise<unknown>;
  await expect(
    handler({ context: { supabase: { rpc, from }, userId: "fixture-user" } }),
  ).rejects.toThrow("Forbidden");
  expect(rpc).toHaveBeenCalledWith("is_super_admin", { _user_id: "fixture-user" });
  expect(from).not.toHaveBeenCalled();
});
