import { describe, expect, it } from "vitest";
import { marketingPlans } from "@/lib/marketing/public-pricing";
import { landingJsonLd } from "@/lib/marketing/landing-content";
import type { PublicPlan } from "@/lib/billing/public-plans";

function plan(
  code: string,
  sort_order: number,
  interval: PublicPlan["interval"] = "month",
  monthly_plan_code: string | null = null,
): PublicPlan {
  return {
    id: code,
    code,
    name: code,
    tier: code,
    description: null,
    tagline: null,
    badge: null,
    cta_label: null,
    price_cents: 1000,
    currency: "USD",
    interval,
    trial_days: 14,
    features: {},
    limits: {},
    highlight: false,
    sort_order,
    is_custom: false,
    monthly_plan_code,
  };
}
describe("public pricing presentation", () => {
  const first = plan("starter", 0);
  const yearly = plan("starter-year", 0, "year", "starter");
  const pro = plan("pro", 1);
  const proYear = plan("pro-year", 1, "year", "pro");
  const enterprise = { ...plan("enterprise", 2, "lifetime"), is_custom: true };
  const all = [first, yearly, pro, proYear, enterprise];
  it("removes original Plan 01 without changing other plan objects or the catalog", () => {
    const catalog = JSON.stringify(all);
    const visible = [first, pro, enterprise];
    expect(marketingPlans(all, visible)).toEqual([pro, enterprise]);
    expect(marketingPlans(all, visible)[0]).toBe(pro);
    expect(JSON.stringify(all)).toBe(catalog);
    expect(visible).toEqual([first, pro, enterprise]);
  });
  it("removes the paired annual plan while keeping other annual plans and contact-sales options", () => {
    expect(marketingPlans(all, [yearly, proYear, enterprise])).toEqual([proYear, enterprise]);
  });
  it("keeps the first remaining annual plan if Plan 01 has no yearly counterpart", () => {
    expect(marketingPlans([first, pro, proYear], [proYear])).toEqual([proYear]);
  });
  it("preserves the catalog's monthly-first stable ordering when sort orders tie", () => {
    const tied = { ...enterprise, sort_order: 0 };
    expect(marketingPlans([tied, first, pro], [first, tied, pro])).toEqual([tied, pro]);
  });
  it("handles empty and single-plan catalogs without inventing a replacement plan", () => {
    expect(marketingPlans([], [])).toEqual([]);
    expect(marketingPlans([first], [first])).toEqual([]);
  });
});
it("does not advertise a removed FAQ in landing structured data", () => {
  const graph = landingJsonLd()["@graph"];
  expect(graph.some((node) => node["@type"] === "FAQPage")).toBe(false);
  expect(graph.map((node) => node["@type"])).toEqual([
    "Organization",
    "WebSite",
    "SoftwareApplication",
  ]);
});
