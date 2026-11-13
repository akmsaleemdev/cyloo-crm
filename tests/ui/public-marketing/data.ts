import type { PublicPlan } from "@/lib/billing/public-plans";

export function useBrandName() {
  return "CYLOO";
}
const branding = { platformName: "CYLOO", supportEmail: "support@example.test" };
export function usePlatformBranding() {
  return branding;
}
export function platformBrandingQueryOptions() {
  return { queryKey: ["branding"], queryFn: async () => branding };
}
export function useTenantCurrency() {
  return "USD";
}
export function useTheme() {
  return { resolvedTheme: "dark" };
}
export function useWhatsAppCta() {
  return {
    enabled: true,
    isFallback: false,
    isInternal: false,
    href: "https://wa.me/15555550123",
    label: "Chat with us",
  };
}
export const supabase = { auth: { getSession: async () => ({ data: { session: null } }) } };
export async function redirectSignedInFromMarketing() {}
export async function submitMarketingLead() {
  return { ok: true };
}
export async function getMyPlanSummary() {
  return null;
}

const base: PublicPlan = {
  id: "starter",
  code: "starter",
  name: "Starter",
  tier: "starter",
  description: "For small teams",
  tagline: "Get started",
  badge: null,
  cta_label: null,
  price_cents: 0,
  currency: "USD",
  interval: "month",
  trial_days: 14,
  features: { ai: true, automations: true, api: true },
  limits: { agents: 5, contacts: 1000 },
  highlight: false,
  sort_order: 0,
  is_custom: false,
  monthly_plan_code: null,
};
export const catalog: PublicPlan[] = [
  base,
  {
    ...base,
    id: "pro",
    code: "pro",
    tier: "pro",
    name: "Professional",
    price_cents: 2900,
    sort_order: 1,
    highlight: true,
    badge: "Popular",
  },
  {
    ...base,
    id: "business",
    code: "business",
    tier: "business",
    name: "Business",
    price_cents: 7900,
    sort_order: 2,
  },
  {
    ...base,
    id: "enterprise",
    code: "enterprise",
    tier: "enterprise",
    name: "Enterprise",
    interval: "lifetime",
    sort_order: 3,
    is_custom: true,
  },
];
catalog.push(
  ...catalog
    .filter((p) => p.interval === "month")
    .map((p) => ({
      ...p,
      id: `${p.id}-year`,
      code: `${p.code}-year`,
      monthly_plan_code: p.code,
      interval: "year" as const,
      price_cents: p.price_cents * 10,
    })),
);
export async function listPublicPlans() {
  return catalog;
}
