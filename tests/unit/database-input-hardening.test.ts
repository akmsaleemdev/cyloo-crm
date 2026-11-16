// @vitest-environment node
import { describe, expect, it } from "vitest";
import { postgrestLiteral } from "@/lib/api/postgrest-filters";
import { validateCrmPatch } from "@/lib/ai/conversation/crm-tool-validation";

describe("exact PostgREST values", () => {
  it.each(["saleem@example.com", "+971501234567", "x),workspace_id.neq.0", 'a"b\\c'])(
    "keeps %s within one quoted value",
    (input) => {
      const encoded = postgrestLiteral(input);
      expect(encoded[0]).toBe('"');
      expect(encoded.at(-1)).toBe('"');
      // Decode using PostgREST quoted-value escape semantics; there must be
      // no unescaped quote before the closing delimiter.
      let decoded = "";
      for (let i = 1; i < encoded.length - 1; i++) {
        if (encoded[i] === "\\") decoded += encoded[++i];
        else {
          expect(encoded[i]).not.toBe('"');
          decoded += encoded[i];
        }
      }
      expect(decoded).toBe(input);
    },
  );
});

describe("AI CRM patch authorization", () => {
  it.each(["contact", "lead", "deal", "task"] as const)(
    "rejects scope changes for %s",
    (entity) => {
      for (const key of [
        "workspace_id",
        "organization_id",
        "owner_id",
        "created_by",
        "id",
        "deleted_at",
        "role",
        "contact_id",
        "custom_fields",
      ]) {
        expect(() => validateCrmPatch(entity, { [key]: "injected" })).toThrow();
      }
    },
  );
  it("allows a typed business update", () => {
    expect(validateCrmPatch("contact", { name: "Customer", do_not_contact: true })).toEqual({
      name: "Customer",
      do_not_contact: true,
    });
    expect(validateCrmPatch("deal", { amount: 100, currency: "AED" })).toEqual({
      amount: 100,
      currency: "AED",
    });
  });
  it("rejects invalid values and empty updates", () => {
    expect(() => validateCrmPatch("contact", {})).toThrow();
    expect(() => validateCrmPatch("contact", { do_not_contact: "false" })).toThrow();
    expect(() => validateCrmPatch("deal", { amount: -1 })).toThrow();
    expect(() => validateCrmPatch("deal", { probability: 101 })).toThrow();
  });
});
