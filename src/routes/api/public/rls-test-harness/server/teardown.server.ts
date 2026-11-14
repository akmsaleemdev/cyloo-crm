import { getHarnessAdmin } from "./harness.server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_USERS_PER_REQUEST = 50;

/**
 * Delete only users created by this test harness, never arbitrary auth users.
 * All calls are restricted to the isolated project by getHarnessAdmin().
 */
export async function teardownHarness(userIds: string[]) {
  if (!Array.isArray(userIds) || userIds.length > MAX_USERS_PER_REQUEST) {
    throw new Error("Invalid harness teardown user list");
  }
  const { admin } = getHarnessAdmin();
  const errors: Array<{ id: string; message: string }> = [];
  let deleted = 0;

  for (const id of new Set(userIds)) {
    if (typeof id !== "string" || !UUID_RE.test(id)) {
      errors.push({ id: String(id), message: "invalid_user_id" });
      continue;
    }

    // Auth.admin.deleteUser has elevated permissions: check both the
    // immutable test email suffix and harness-created metadata first.
    const { data, error: lookupError } = await admin.auth.admin.getUserById(id);
    const user = data?.user;
    if (lookupError || !user) {
      errors.push({ id, message: "user_not_found" });
      continue;
    }

    if (
      user.user_metadata?.rls_harness !== true ||
      typeof user.user_metadata?.run_id !== "string" ||
      !user.email?.endsWith("@rls-harness.test")
    ) {
      errors.push({ id, message: "not_a_harness_user" });
      continue;
    }

    const { error } = await admin.auth.admin.deleteUser(id, true);
    if (error) errors.push({ id, message: "delete_failed" });
    else deleted += 1;
  }

  return { deleted, errors };
}
