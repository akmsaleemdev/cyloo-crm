import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isServerDemoMode } from "@/lib/demo/mode.server";
import { trackPublicVCardView } from "@/routes/api/public/vcard-view/server/track-view.server";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/demo/mode.server", () => ({
  isServerDemoMode: vi.fn(),
}));

vi.mock("@/lib/demo/admin-write-guard.server", () => ({
  supabaseAdmin: { rpc },
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
  rpc.mockResolvedValue({ data: "recorded", error: null });
});

describe("Public vCard view tracking security", () => {
  it("is disabled until the explicit rollout flag is enabled", async () => {
    delete process.env.VCARD_VIEW_API_ENABLED;
    expect(await trackPublicVCardView(ID, request())).toBe("disabled");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("blocks recording in demo mode", async () => {
    vi.mocked(isServerDemoMode).mockReturnValue(true);
    expect(await trackPublicVCardView(ID, request())).toBe("disabled");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects invalid identifiers before accessing the database", async () => {
    expect(await trackPublicVCardView("not-a-uuid", request())).toBe("invalid");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns not_found for private or revoked cards as decided by the database", async () => {
    rpc.mockResolvedValue({ data: "not_found", error: null });
    expect(await trackPublicVCardView(ID, request())).toBe("not_found");
  });

  it("acknowledges shared rate-limit rejections without reporting a recorded view", async () => {
    rpc.mockResolvedValue({ data: "throttled", error: null });
    expect(await trackPublicVCardView(ID, request())).toBe("throttled");
  });

  it("records only with server-selected RPC parameters", async () => {
    expect(await trackPublicVCardView(ID, request())).toBe("recorded");
    expect(rpc).toHaveBeenCalledWith("record_public_vcard_view", {
      _vcard_id: ID,
      _referrer: "https://test.example/v/test",
      _user_agent: "ExampleBrowser",
    });
  });

  it("never claims success when the database rejects the operation", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501" } });
    expect(await trackPublicVCardView(ID, request())).toBe("failed");
  });

  it("fails closed on unexpected RPC output", async () => {
    rpc.mockResolvedValue({ data: "unexpected", error: null });
    expect(await trackPublicVCardView(ID, request())).toBe("failed");
  });
});
