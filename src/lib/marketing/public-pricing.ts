import type { PublicPlan } from "@/lib/billing/public-plans";

/** Presentation only: exclude the original monthly Plan 01 and its paired yearly price. */
export function marketingPlans(all: readonly PublicPlan[], visible: readonly PublicPlan[]) {
  const original = [
    ...all.filter((plan) => plan.interval === "month"),
    ...all.filter(
      (plan) =>
        plan.interval !== "month" &&
        (plan.is_custom || plan.interval === "lifetime" || plan.tier === "enterprise"),
    ),
  ].sort((a, b) => a.sort_order - b.sort_order)[0];
  const first = original ?? [...all].sort((a, b) => a.sort_order - b.sort_order)[0];
  if (!first) return [...visible];
  const hiddenCode = first.monthly_plan_code ?? first.code;
  return visible.filter(
    (plan) => plan.code !== hiddenCode && plan.monthly_plan_code !== hiddenCode,
  );
}
