import { beforeAll, describe, expect, it } from "vitest";

// Read-only checks against synthetic fixtures in an explicitly isolated project.
// This suite never creates/deletes users, changes policies, or writes customer data.
const required = [
  "SUPABASE_TEST_URL",
  "SUPABASE_TEST_PUBLISHABLE_KEY",
  "RLS_TENANT_A_TOKEN",
  "RLS_TENANT_B_TOKEN",
  "RLS_TENANT_A_WORKSPACE_ID",
  "RLS_TENANT_B_WORKSPACE_ID",
  "RLS_TENANT_A_CONTACT_ID",
  "RLS_TENANT_B_CONTACT_ID",
] as const;

beforeAll(() => {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Isolated RLS fixtures required: ${missing.join(", ")}`);
  if (process.env.RLS_TEST_ENVIRONMENT !== "isolated") {
    throw new Error(
      "Set RLS_TEST_ENVIRONMENT=isolated only for the approved synthetic fixture project",
    );
  }
  expect(process.env.RLS_TENANT_A_WORKSPACE_ID).not.toBe(process.env.RLS_TENANT_B_WORKSPACE_ID);
});

async function readContact(token: string, contactId: string) {
  const url = new URL("/rest/v1/contacts", process.env.SUPABASE_TEST_URL);
  url.searchParams.set("select", "id,workspace_id");
  url.searchParams.set("id", `eq.${contactId}`);
  const response = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_TEST_PUBLISHABLE_KEY!,
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 403) return { status: 403, rows: [] };
  expect(response.status).toBe(200);
  return { status: response.status, rows: await response.json() };
}

describe("Live read isolation", () => {
  for (const [own, other] of [
    ["A", "B"],
    ["B", "A"],
  ] as const) {
    it(`tenant ${own} can read its own fixture and cannot read tenant ${other}'s fixture`, async () => {
      const token = process.env[`RLS_TENANT_${own}_TOKEN`]!;
      const ownId = process.env[`RLS_TENANT_${own}_CONTACT_ID`]!;
      const ownWorkspace = process.env[`RLS_TENANT_${own}_WORKSPACE_ID`]!;
      const ownResult = await readContact(token, ownId);
      expect(ownResult.status).toBe(200);
      expect(ownResult.rows).toEqual([{ id: ownId, workspace_id: ownWorkspace }]);
      const foreign = await readContact(token, process.env[`RLS_TENANT_${other}_CONTACT_ID`]!);
      expect(foreign.rows).toEqual([]);
    });
  }
});
