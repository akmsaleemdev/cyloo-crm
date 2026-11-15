/**
 * Billing webhook event router (server-only).
 *
 * Shared by the live webhook endpoint (`/api/public/webhooks/billing/:provider`)
 * and the super-admin replay tool, so a replayed event goes through exactly the
 * same side effects as the original delivery.
 *
 * Flow: raw provider payload -> `normalizeProviderEvent` (resolves
 * organization + internal plan code) -> subscription/payment engines.
 *
 * Events we cannot attribute to an organization, or that reference a gateway
 * price with no plan mapping, are ack'ed and left in `billing_events` with a
 * reason instead of failing the delivery (providers retry hard on 4xx/5xx).
 */
import { sbAny } from "@/lib/supabase/untyped";

export type BillingWebhookEvent = {
  id: string;
  type: string;
  data: unknown;
  provider: string;
};

export type RouteResult = { handled: boolean; reason?: string };

export async function routeProviderEvent(
  supabase: unknown,
  event: BillingWebhookEvent,
): Promise<RouteResult> {
  // Wire notifications on first event of the process.
  const { subscribeBillingNotifications } = await import("@/lib/billing/notifications.server");
  const db = sbAny(supabase);
  subscribeBillingNotifications(db);

  // Marketplace Buy-now sessions are fulfilled before the subscription/payment
  // normalizer runs — they are plugin purchases, not plan billing.
  if (event.type === "checkout.session.completed") {
    const session = (event.data as { object?: unknown })?.object ?? event.data;
    const { fulfilPluginCheckout, PLUGIN_CHECKOUT_PURPOSE } =
      await import("@/lib/marketplace/plugin-checkout.server");
    const purpose = (session as { metadata?: Record<string, string> })?.metadata?.cyloo_purpose;
    if (purpose === PLUGIN_CHECKOUT_PURPOSE) {
      return fulfilPluginCheckout(session);
    }
  }

  const { normalizeProviderEvent } = await import("@/lib/billing/webhook-normalize.server");
  const normalized = await normalizeProviderEvent(db, event.provider, event.type, event.data);

  if (normalized.kind === "ignored") {
    return { handled: false, reason: normalized.reason };
  }

  if (normalized.kind === "subscription") {
    const { upsertSubscriptionFromSnapshot } =
      await import("@/lib/billing/subscription-engine.server");
    await upsertSubscriptionFromSnapshot(db, normalized.organization_id, normalized.snapshot);
    return { handled: true };
  }

  // Payment (renewal charge, first charge, dunning failure).
  const { recordPaymentAttempt } = await import("@/lib/billing/payment-engine.server");
  const p = normalized.payment;
  await recordPaymentAttempt(db, {
    organization_id: p.organization_id,
    invoice_id: p.invoice_id ?? undefined,
    subscription_id: p.subscription_id ?? undefined,
    provider: event.provider,
    provider_payment_id: p.provider_payment_id ?? undefined,
    amount_cents: p.amount_cents,
    currency: p.currency,
    status: p.status,
    failure_code: p.failure_code ?? undefined,
    failure_message: p.failure_message ?? undefined,
    metadata: p.metadata,
  });

  await applyPaymentOutcomeToSubscription(db, event.provider, normalized);
  return { handled: true };
}

/**
 * Keep the subscription row aligned with the payment outcome:
 *  - success  -> refresh the snapshot from the gateway (new period dates,
 *                status back to `active` after dunning recovery)
 *  - failure  -> mark `past_due` so entitlement checks and dunning kick in
 *
 * Gateway refresh is best-effort: a missing API key must not fail the webhook.
 */
async function applyPaymentOutcomeToSubscription(
  supabase: unknown,
  providerId: string,
  normalized: Extract<
    Awaited<
      ReturnType<typeof import("@/lib/billing/webhook-normalize.server").normalizeProviderEvent>
    >,
    { kind: "payment" }
  >,
) {
  const { payment, refresh_subscription_id } = normalized;

  if (payment.status === "failed") {
    await sbAny(supabase)
      .from("subscriptions")
      .update({ status: "past_due" })
      .eq("organization_id", payment.organization_id)
      .in("status", ["active", "trialing"]);
    return;
  }

  if (!refresh_subscription_id) return;
  try {
    const { getBillingProvider } = await import("@/lib/billing/providers");
    const provider = getBillingProvider(providerId);
    const snap = await provider.getSubscription(refresh_subscription_id);
    const { resolvePlanCodeFromExternal } = await import("@/lib/billing/webhook-normalize.server");
    const plan_code =
      (await resolvePlanCodeFromExternal(supabase, providerId, snap.plan_code)) ?? snap.plan_code;
    const { upsertSubscriptionFromSnapshot } =
      await import("@/lib/billing/subscription-engine.server");
    await upsertSubscriptionFromSnapshot(sbAny(supabase), payment.organization_id, {
      ...snap,
      plan_code,
    });
  } catch (err) {
    // Fall back to the minimum guarantee: a successful charge reactivates.
    console.warn("[billing webhook] subscription refresh skipped:", (err as Error).message);
    await sbAny(supabase)
      .from("subscriptions")
      .update({ status: "active" })
      .eq("organization_id", payment.organization_id)
      .in("status", ["past_due", "incomplete"]);
  }
}
