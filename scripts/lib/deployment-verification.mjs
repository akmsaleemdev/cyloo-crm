/** Read-only verification that a host is serving the intended artifact. */
export async function verifyDeployment({ origin, commit, fetchImpl = fetch }) {
  if (!commit) throw new Error("Provide the expected artifact commit with --commit.");
  const base = new URL(origin);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) {
    throw new Error("Provide an HTTP(S) origin without credentials.");
  }
  const health = await fetchImpl(new URL("/api/public/health", base), {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!health.ok) throw new Error(`Health endpoint returned HTTP ${health.status}.`);
  const data = await health.json();
  if (data.status !== "ok" || data.commit !== commit || !data.built_at) {
    throw new Error(
      `Deployment mismatch: expected ${commit}, received ${data.commit ?? "unknown"} (built_at: ${data.built_at ?? "missing"}).`,
    );
  }
  const worker = await fetchImpl(new URL("/sw.js", base), {
    method: "HEAD",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const policy = worker.headers.get("cache-control") ?? "";
  const ages = [...policy.matchAll(/(?:^|,)\s*(?:s-maxage|max-age)\s*=\s*"?(\d+)/gi)];
  if (
    !worker.ok ||
    (!/\b(?:no-cache|no-store)\b/i.test(policy) &&
      (!ages.length || ages.some((match) => Number(match[1]) > 0)))
  ) {
    throw new Error(
      `Service worker must revalidate; HTTP ${worker.status}, Cache-Control: ${policy || "missing"}.`,
    );
  }
  return data;
}
