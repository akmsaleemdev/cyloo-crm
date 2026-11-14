/**
 * Tax labels and starting rates, NOT a tax determination engine.
 * Country is taken only from the tenant's explicitly saved organization profile.
 * Supply location, registration, product classification, exemptions and effective
 * dates can change the tax due; users must review tax before issuing a document.
 */
export type TaxBreakdown = { code: string; rate: number; amount: number };
export type IndiaSupplyType = "intra_state" | "inter_state" | "unknown";

const GST_COUNTRIES = new Set(["IN", "AU", "NZ", "SG"]);
const VAT_COUNTRIES = new Set([
  "AE", "SA", "BH", "OM", "GB", "IE", "DE", "FR", "IT", "ES", "PT",
  "NL", "BE", "AT", "SE", "DK", "FI", "NO", "PL", "CZ", "HU",
  "RO", "BG", "HR", "GR", "CY", "MT", "LU", "LV", "LT", "EE",
  "SK", "SI", "ZA", "KE", "NG", "GH", "EG", "TR", "CH",
]);

export function taxDisplayName(country: string | null | undefined): string {
  const code = country?.toUpperCase() ?? "";
  if (GST_COUNTRIES.has(code)) return "GST";
  if (VAT_COUNTRIES.has(code)) return "VAT";
  if (code === "CA") return "GST/HST";
  if (code === "US") return "Sales tax";
  return "Tax";
}

/**
 * Safe opt-in starting value. Only AE/SA provide standard-rate examples.
 * Do NOT infer a taxable GST slab for India or a rate for other jurisdictions.
 */
export function suggestedStandardRate(country: string | null | undefined): number | null {
  switch (country?.toUpperCase()) {
    case "AE": return 5;
    case "SA": return 15;
    default: return null;
  }
}

export function taxBreakdown(
  country: string | null | undefined,
  taxableAmount: number,
  totalRate: number,
  indiaSupply: IndiaSupplyType = "unknown",
): TaxBreakdown[] {
  if (!Number.isFinite(taxableAmount) || !Number.isFinite(totalRate) || totalRate < 0 || totalRate > 100)
    throw new Error("Invalid tax calculation inputs");
  const code = taxDisplayName(country);
  if (country?.toUpperCase() !== "IN") {
    return [{ code, rate: totalRate, amount: Number((taxableAmount * totalRate / 100).toFixed(2)) }];
  }
  if (indiaSupply === "unknown")
    throw new Error("Select the India supply type to calculate CGST/SGST or IGST");
  if (indiaSupply === "inter_state")
    return [{ code: "IGST", rate: totalRate, amount: Number((taxableAmount * totalRate / 100).toFixed(2)) }];
  const total = Number((taxableAmount * totalRate / 100).toFixed(2));
  const cgst = Number((total / 2).toFixed(2));
  return [
    { code: "CGST", rate: totalRate / 2, amount: cgst },
    { code: "SGST/UTGST", rate: totalRate / 2, amount: Number((total - cgst).toFixed(2)) },
  ];
}
