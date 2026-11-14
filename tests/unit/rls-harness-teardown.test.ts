import { beforeEach, describe, expect, it, vi } from "vitest";
import { getHarnessAdmin } from "@/routes/api/public/rls-test-harness/server/harness.server";
import { teardownHarness } from "@/routes/api/public/rls-test-harness/server/teardown.server";

vi.mock("@/routes/api/public/rls-test-harness/server/harness.server", () => ({
  getHarnessAdmin: vi.fn(),
}));

const TEST_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

const lookup = vi.fn();
const remove = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getHarnessAdmin).mockReturnValue({
    admin: { auth: { admin: { getUserById: lookup, deleteUser: remove } } },
  } as unknown as ReturnType<typeof getHarnessAdmin>);
  lookup.mockResolvedValue({
    data: {
      user: {
        id: TEST_ID,
        email: "rls-a-run@rls-harness.test",
        app_metadata: { rls_harness: true, run_id: "test-run" },
      },
    },
    error: null,
  });
  remove.mockResolvedValue({ error: null });
});

describe("RLS harness teardown authorization", () => {
  it("rejects malformed IDs without looking up or deleting any user", async () => {
    const result = await teardownHarness(["not-a-uuid"]);
    expect(result).toEqual({
      deleted: 0,
      errors: [{ id: "not-a-uuid", message: "invalid_user_id" }],
    });
    expect(lookup).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("rejects more than 50 requested users before calling the admin client", async () => {
    await expect(teardownHarness(Array.from({ length: 51 }, () => TEST_ID))).rejects.toThrow(
      "Invalid harness teardown user list",
    );
    expect(getHarnessAdmin).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("refuses ordinary CRM users, even when their user metadata claims to be a test user", async () => {
    lookup.mockResolvedValue({
      data: {
        user: {
          id: TEST_ID,
          email: "regular@example.com",
          user_metadata: { rls_harness: true, run_id: "forged" },
          app_metadata: {},
        },
      },
      error: null,
    });
    const result = await teardownHarness([TEST_ID]);
    expect(result.errors[0]?.message).toBe("not_a_harness_user");
    expect(result.deleted).toBe(0);
    expect(remove).not.toHaveBeenCalled();
  });

  it("rejects a test-looking email without server-controlled app metadata", async () => {
    lookup.mockResolvedValue({
      data: {
        user: { id: TEST_ID, email: "fake@rls-harness.test", app_metadata: {} },
      },
      error: null,
    });
    const result = await teardownHarness([TEST_ID]);
    expect(result.errors[0]?.message).toBe("not_a_harness_user");
    expect(remove).not.toHaveBeenCalled();
  });

  it("reports missing users without attempting deletion", async () => {
    lookup.mockResolvedValue({ data: { user: null }, error: null });
    const result = await teardownHarness([TEST_ID]);
    expect(result.errors[0]?.message).toBe("user_not_found");
    expect(remove).not.toHaveBeenCalled();
  });

  it("deletes verified synthetic users and deduplicates repeated IDs", async () => {
    lookup.mockImplementation(async (id: string) => ({
      data: {
        user: {
          id,
          email: "rls-a-run@rls-harness.test",
          app_metadata: { rls_harness: true, run_id: "test-run" },
        },
      },
      error: null,
    }));
    const result = await teardownHarness([TEST_ID, TEST_ID, OTHER_ID]);
    expect(result).toEqual({ deleted: 2, errors: [] });
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledWith(TEST_ID, true);
    expect(remove).toHaveBeenCalledWith(OTHER_ID, true);
  });

  it("does not report failed deletions as successful", async () => {
    remove.mockResolvedValue({ error: { message: "failure" } });
    const result = await teardownHarness([TEST_ID]);
    expect(result).toEqual({
      deleted: 0,
      errors: [{ id: TEST_ID, message: "delete_failed" }],
    });
  });
});
