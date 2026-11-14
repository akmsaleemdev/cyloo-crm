import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isServerDemoMode } from "@/lib/demo/mode.server";
import { trackPublicVCardView } from "@/routes/api/public/vcard-view/server/track-view.server";

const { lookup, insert } = vi.hoisted(() => ({
  lookup: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/lib/demo/mode.server", () => ({
  isServerDemoMode: vi.fn(),
}));

vi.mock("@/lib/demo/admin-write-guard.server", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "vcards") {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: lookup }),
          }),
        };
      }
      if (table === "vcard_views") return { insert };
      throw new Error("Unexpected table");
    },
  },
}));

const ID = "11111111-1111-4111-8111-111111111111";
const request = () =>
  new Request("https://test.example/api/public/vcard-view", {
    method: "POST",
    headers: { referer: "https://test.example/v/test", "user-agent": "ExampleBrowser" },
  });

const initialFlag = process.env.VCARD_VIEW_API_ENABLED;

afterEach(() => {
  if (initialFlag === undefined) delete process.env.VCARD_VIEW_API_ENABLED;
  else process.env.VCARD_VIEW_API_ENABLED = initialFlag;
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.VCARD_VIEW_API_ENABLED = "true";
  vi.mocked(isServerDemoMode).mockReturnValue(false);
  lookup.mockResolvedValue({
    data: { id: ID, is_public: true, revoked_at: null },
    error: null,
  });
  insert.mockResolvedValue({ error: null });
});

describe("Public vCard view tracking security", () => {
  it("is disabled until the explicit rollout flag is enabled", async () => {
    delete process.env.VCARD_VIEW_API_ENABLED;
    expect(await trackPublicVCardView(ID, request())).toBe("disabled");
    expect(lookup).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("blocks recording in demo mode", async () => {
    vi.mocked(isServerDemoMode).mockReturnValue(true);
    expect(await trackPublicVCardView(ID, request())).toBe("disabled");
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects invalid identifiers before accessing the database", async () => {
    expect(await trackPublicVCardView("not-a-uuid", request())).toBe("invalid");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("does not record views for private cards", async () => {
    lookup.mockResolvedValue({
      data: { id: ID, is_public: false, revoked_at: null },
      error: null,
    });
    expect(await trackPublicVCardView(ID, request())).toBe("not_found");
    expect(insert).not.toHaveBeenCalled();
  });

  it("does not record views for revoked cards", async () => {
    lookup.mockResolvedValue({
      data: { id: ID, is_public: true, revoked_at: "2026-01-01T00:00:00Z" },
      error: null,
    });
    expect(await trackPublicVCardView(ID, request())).toBe("not_found");
    expect(insert).not.toHaveBeenCalled();
  });

  it("records only a verified public card with server-selected fields", async () => {
    expect(await trackPublicVCardView(ID, request())).toBe("recorded");
    expect(insert).toHaveBeenCalledWith({
      vcard_id: ID,
      referrer: "https://test.example/v/test",
      user_agent: "ExampleBrowser",
    });
  });

  it("never claims success when the database rejects the insert", async () => {
    insert.mockResolvedValue({ error: { code: "42501" } });
    expect(await trackPublicVCardView(ID, request())).toBe("failed");
  });
});
