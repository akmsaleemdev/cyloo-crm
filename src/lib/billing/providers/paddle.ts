/**
 * Paddle adapter (Billing v2).
 *
 * Only the pieces needed for webhook-driven subscription lifecycle are wired
 * against the REST API (no SDK, so it runs in the Worker runtime):
 *   - `verifyWebhook` — Paddle-Signature HMAC verification
 *   - `getSubscription` / `cancelSubscription` — snapshot refresh + cancel
 *
 * Everything else still falls back to the stub's explicit "unsupported" error.
 * Secrets: PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET, optional PADDLE_ENV=live.
 */
import { createStubProvider } from "./_stub";
import type {
  BillingProvider,
  SubscriptionSnapshot,
  WebhookEvent,
  WebhookVerifyInput,
} from "./types";
import { z } from "zod";

const subscriptionSchema = z
  .object({
    id: z.string(),
    customer_id: z.string().nullable().optional(),
    status: z.string(),
    items: z
      .array(
        z.object({
          price: z.object({ id: z.string().optional() }).optional(),
          quantity: z.number().optional(),
          trial_dates: z.object({ ends_at: z.string().nullable().optional() }).optional(),
        }),
      )
      .optional(),
    current_billing_period: z
      .object({
        starts_at: z.string().nullable().optional(),
        ends_at: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    started_at: z.string().nullable().optional(),
    next_billed_at: z.string().nullable().optional(),
    scheduled_change: z
      .object({ action: z.string().optional(), effective_at: z.string().nullable().optional() })
      .nullable()
      .optional(),
    canceled_at: z.string().nullable().optional(),
    custom_data: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .nullable()
      .optional(),
  })
  .passthrough();

const base = createStubProvider({
  id: "paddle",
  displayName: "Paddle",
  supports: {
    checkout: true,
    customer_portal: true,
    usage_reporting: true,
    tax: true,
    coupons: true,
    payments: true,
    refunds: true,
    partial_refunds: true,
    webhooks: true,
  },
});

function apiBase(): string {
  return process.env.PADDLE_ENV === "live"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

async function paddleGet<T>(path: string): Promise<T> {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("PADDLE_API_KEY is not configured.");
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const errorObject =
      raw && typeof raw === "object" && "error" in raw && raw.error && typeof raw.error === "object"
        ? raw.error
        : null;
    const detail =
      errorObject && "detail" in errorObject && typeof errorObject.detail === "string"
        ? errorObject.detail
        : res.statusText;
    throw new Error(`Paddle GET ${path} failed: ${detail}`);
  }
  if (!raw || typeof raw !== "object" || !("data" in raw)) {
    throw new Error(`Paddle GET ${path} returned an invalid response`);
  }
  return raw.data as T;
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function mapSubscription(raw: unknown): SubscriptionSnapshot {
  const s = subscriptionSchema.parse(raw);
  const item = s?.items?.[0] ?? {};
  return {
    provider: "paddle",
    provider_subscription_id: s.id,
    provider_customer_id: s.customer_id ?? "",
    status:
      s.status === "canceled" || s.status === "cancelled"
        ? "canceled"
        : s.status === "past_due"
          ? "past_due"
          : s.status === "paused"
            ? "paused"
            : s.status === "trialing"
              ? "trialing"
              : "active",
    plan_code: item.price?.id ?? "",
    quantity: item.quantity ?? 1,
    current_period_start:
      s.current_billing_period?.starts_at ?? s.started_at ?? new Date().toISOString(),
    current_period_end:
      s.current_billing_period?.ends_at ?? s.next_billed_at ?? new Date().toISOString(),
    trial_ends_at: item.trial_dates?.ends_at ?? null,
    cancel_at: s.scheduled_change?.action === "cancel" ? s.scheduled_change.effective_at : null,
    canceled_at: s.canceled_at ?? null,
    metadata: s.custom_data ?? {},
  };
}

export const paddleProvider: BillingProvider = {
  ...base,

  async verifyWebhook({ raw_body, signature, secret }: WebhookVerifyInput): Promise<WebhookEvent> {
    if (!signature) throw new Error("Missing Paddle-Signature header");
    // Format: ts=<unix>;h1=<hex hmac of `${ts}:${rawBody}`>
    const parts = Object.fromEntries(
      signature.split(";").map((p) => p.split("=") as [string, string]),
    );
    const ts = parts.ts;
    const h1 = parts.h1;
    if (!ts || !h1) throw new Error("Malformed Paddle signature");

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(`${ts}:${raw_body}`));
    if (!timingSafeEqualHex(hex(mac), h1)) throw new Error("Invalid Paddle signature");

    // Reject deliveries older than 5 minutes (replay protection).
    const age = Math.abs(Date.now() / 1000 - Number(ts));
    if (!Number.isFinite(age) || age > 300)
      throw new Error("Paddle signature timestamp out of tolerance");

    const eventSchema = z.object({
      event_id: z.string().optional(),
      notification_id: z.string().optional(),
      event_type: z.string(),
      data: z.unknown(),
    });
    const event = eventSchema.parse(JSON.parse(raw_body) as unknown);
    const eventId = event.event_id ?? event.notification_id;
    if (!eventId) throw new Error("Paddle event has no identifier");
    return {
      provider: "paddle",
      id: eventId,
      type: event.event_type,
      data: event.data,
    };
  },

  async getSubscription(id: string): Promise<SubscriptionSnapshot> {
    return mapSubscription(await paddleGet<unknown>(`/subscriptions/${encodeURIComponent(id)}`));
  },
};
