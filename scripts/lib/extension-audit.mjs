/** Require catalog evidence; missing RPCs and malformed results cannot establish safety. */
export function validateExtensionAuditResult({ data, error }) {
  if (error)
    throw new Error(
      "Extension catalog audit unavailable; inspect the catalog through approved database access.",
    );
  if (!Array.isArray(data)) throw new Error("Extension catalog audit returned an invalid result.");
  if (data.length) throw new Error("Extension helper functions were found in the public schema.");
}
