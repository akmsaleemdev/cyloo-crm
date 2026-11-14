/**
 * Tax labels and starting rates, NOT a tax determination engine.
 * Country is taken only from the tenant's explicitly saved organization profile.
 * Supply location, registration, product classification, exemptions and effective
 * dates can change the tax due; users must review tax before issuing a document.
 */
export type TaxBreakdown = { code: string; rate: number; amount: number };
export type IndiaSupplyType = "intra_state" | "inter_state" | "unknown";

export function taxDisplayName(country: string | null | undefined): string {
  switch (country?.toUpperCase()) {
    case "IN": return "GST";
    case "AE": case "SA": case "BH": case "OM": return "VAT";
    case "GB": return "VAT";
    case "US": return "Sales tax";
    case "CA": return "GST/HST";
    case "AU": case "NZ": case "SG": return "GST";
    default: return "Tax";
  }
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
