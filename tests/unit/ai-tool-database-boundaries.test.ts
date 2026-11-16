// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@/lib/ai/conversation/tools.server";
vi.mock("@/lib/currency/resolve.server", () => ({ resolveWorkspaceCurrency: async () => "AED" }));
import { buildConversationTools } from "@/lib/ai/conversation/tools.server";

const workspaceId = "11111111-1111-4111-8111-111111111111";
let client: SupabaseClient;
let requests: { url: URL; method: string; body: unknown }[];

beforeEach(async () => {
  requests = [];
  const { createClient } =
    await vi.importActual<typeof import("@supabase/supabase-js")>("@supabase/supabase-js");
  client = createClient("https://audit-test.supabase.co", "public-test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        requests.push({
          url: new URL(String(input)),
          method: init?.method ?? "GET",
          body: init?.body ? JSON.parse(String(init.body)) : null,
        });
        return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
      },
    },
  });
});

async function execute(name: string, input: unknown) {
  const tools = buildConversationTools({
    supabase: client,
    workspaceId,
    userId: workspaceId,
    conversationId: workspaceId,
  } satisfies ToolContext);
  const tool = tools[name] as unknown as { execute: (input: unknown) => Promise<unknown> };
  return tool.execute(input);
}

describe("AI tools preserve database boundaries", () => {
  it("quotes filter syntax while preserving the independent workspace predicate", async () => {
    await execute("lookup_customer", { query: 'x"),workspace_id.neq.0' });
    const request = requests.find((r) => r.url.pathname.endsWith("/contacts"))!;
    expect(request.url.searchParams.get("workspace_id")).toBe(`eq.${workspaceId}`);
    expect(request.url.searchParams.get("deleted_at")).toBe("is.null");
    expect(request.url.searchParams.get("or")).toBe(
      '(email.eq."x\\"),workspace_id.neq.0",phone.eq."x\\"),workspace_id.neq.0")',
    );
    expect(request.url.searchParams.get("limit")).toBe("3");
  });
  it("does not compare an ordinary email to a UUID column", async () => {
    await execute("lookup_customer", { query: "saleem@example.com" });
    expect(requests[0].url.searchParams.get("or")).not.toContain("id.eq.");
  });
  it("keeps invoice references as literal strings", async () => {
    await execute("check_order", { reference: "INV-2026-001" });
    const request = requests.find((r) => r.url.pathname.endsWith("/invoices"))!;
    expect(request.url.searchParams.get("or")).toBe('(invoice_number.eq."INV-2026-001")');
    expect(request.url.searchParams.get("workspace_id")).toBe(`eq.${workspaceId}`);
  });
  it("rejects a tenant change before issuing an update", async () => {
    await execute("update_crm", {
      entity: "contact",
      id: workspaceId,
      fields: { workspace_id: workspaceId },
    });
    expect(requests.some((r) => r.method === "PATCH")).toBe(false);
  });
  it("scopes a permitted update and retains its typed fields", async () => {
    await execute("update_crm", {
      entity: "contact",
      id: workspaceId,
      fields: { name: "Updated" },
    });
    const request = requests.find((r) => r.method === "PATCH")!;
    expect(request.body).toEqual({ name: "Updated" });
    expect(request.url.searchParams.get("workspace_id")).toBe(`eq.${workspaceId}`);
    expect(request.url.searchParams.get("deleted_at")).toBe("is.null");
  });
});
