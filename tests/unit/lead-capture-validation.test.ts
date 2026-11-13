// @vitest-environment node
import { describe, expect, it } from "vitest";
import { leadCaptureSchema } from "@/lib/marketing/lead-capture";

const validLead = {
  fullName: "Jane Example",
  workEmail: "Jane@company.example",
  companySize: "11-50",
};

describe("public lead validation", () => {
  it("preserves campaign metadata and applies contact defaults", () => {
    expect(
      leadCaptureSchema.parse({ ...validLead, utm: { utm_source: "campaign" } }),
    ).toMatchObject({
      workEmail: "jane@company.example",
      contactMethod: "email",
      utm: { utm_source: "campaign" },
    });
  });
  it("shows the company size validation message", () => {
    const parsed = leadCaptureSchema.safeParse({ ...validLead, companySize: "invalid" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0].message).toBe("Select your company size");
  });
  it("rejects an invalid WhatsApp number and non-string campaign values", () => {
    expect(
      leadCaptureSchema.safeParse({
        ...validLead,
        contactMethod: "whatsapp",
        whatsappNumber: "123",
      }).success,
    ).toBe(false);
    expect(leadCaptureSchema.safeParse({ ...validLead, utm: { utm_source: 42 } }).success).toBe(
      false,
    );
  });
});
