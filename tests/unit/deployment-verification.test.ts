// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { verifyDeployment } from "../../scripts/lib/deployment-verification.mjs";

const options = { origin: "https://crm.example.com", commit: "release-sha" };
function responses(commit = "release-sha", policy = "no-cache, max-age=0, must-revalidate") {
  return vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ status: "ok", commit, built_at: "2026-11-13T00:00:00Z" }),
    )
    .mockResolvedValueOnce(new Response(null, { headers: { "cache-control": policy } }));
}

describe("deployed artifact verification", () => {
  it("accepts the intended artifact and a revalidating worker", async () => {
    const fetchImpl = responses();
    await expect(verifyDeployment({ ...options, fetchImpl })).resolves.toMatchObject({
      commit: options.commit,
    });
    expect(fetchImpl.mock.calls[0][0].pathname).toBe("/api/public/health");
    expect(fetchImpl.mock.calls[1][1].method).toBe("HEAD");
  });

  it("rejects a healthy server running an older release", async () => {
    await expect(
      verifyDeployment({ ...options, fetchImpl: responses("older-sha") }),
    ).rejects.toThrow("Deployment mismatch");
  });

  it("rejects the live site's 30-day worker caching policy", async () => {
    await expect(
      verifyDeployment({
        ...options,
        fetchImpl: responses("release-sha", "max-age=2592000, public, no-transform"),
      }),
    ).rejects.toThrow("Service worker must revalidate");
  });

  it("rejects unavailable health checks", async () => {
    await expect(
      verifyDeployment({
        ...options,
        fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
      }),
    ).rejects.toThrow("HTTP 503");
  });
});
