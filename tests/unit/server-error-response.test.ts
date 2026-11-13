import { afterEach, describe, expect, it, vi } from "vitest";

const { fetchHandler } = vi.hoisted(() => ({ fetchHandler: vi.fn() }));
vi.mock("@tanstack/react-start/server-entry", () => ({ default: { fetch: fetchHandler } }));
vi.mock("../../src/lib/error-capture", () => ({ consumeLastCapturedError: () => undefined }));
vi.mock("../../src/lib/error-page", () => ({
  renderErrorPage: () => "<!doctype html><p>Unavailable</p>",
}));
import server from "../../src/server";

afterEach(() => vi.restoreAllMocks());

describe("Server error response contracts", () => {
  it.each(["/api/public/example", "/_serverFn/example"])(
    "preserves JSON errors for %s",
    async (path) => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      fetchHandler.mockResolvedValue(
        Response.json({ unhandled: true, message: "HTTPError" }, { status: 500 }),
      );
      const response = await server.fetch(new Request(`https://crm.example.com${path}`), {}, {});
      expect(response.status).toBe(500);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(await response.json()).toEqual({ unhandled: true, message: "HTTPError" });
    },
  );
  it("renders a safe HTML fallback for failed page requests", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchHandler.mockResolvedValue(
      Response.json({ unhandled: true, message: "HTTPError" }, { status: 500 }),
    );
    const response = await server.fetch(new Request("https://crm.example.com/dashboard"), {}, {});
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("Unavailable");
  });
  it("does not expose exception details in API responses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchHandler.mockRejectedValue(new Error("sensitive provider detail"));
    const response = await server.fetch(new Request("https://crm.example.com/api/example"), {}, {});
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});
