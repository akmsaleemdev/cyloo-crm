import { describe, expect, it } from "vitest";
import { platformFieldErrors, validatePlatformSettingValue } from "@/lib/admin/platform-settings-validation";

describe("platform billing VAT default", () => {
  it("accepts the UAE standard 5% and retains unrelated billing configuration", () => {
    expect(validatePlatformSettingValue("billing", { default_vat_rate: 5, invoice_prefix: "INV-" }))
      .toEqual({ default_vat_rate: 5, invoice_prefix: "INV-" });
  });

  it("accepts zero-rated supplies and decimal rates", () => {
    expect(platformFieldErrors("billing", { default_vat_rate: 0 })).toEqual({});
    expect(platformFieldErrors("billing", { default_vat_rate: 7.5 })).toEqual({});
  });

  it.each([-1, 101, NaN, Infinity, "5"])(
    "rejects an invalid VAT rate %s",
    (rate) => {
      expect(platformFieldErrors("billing", { default_vat_rate: rate }).default_vat_rate)
        .toBeTruthy();
      expect(() => validatePlatformSettingValue("billing", { default_vat_rate: rate }))
        .toThrow();
    },
  );
});
