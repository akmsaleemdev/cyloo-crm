import { z } from "zod";
import type { PaymentOrder, PaymentState, ProviderConfig } from "./online-payment-providers.server";

async function connect(config: ProviderConfig) {
  const base =
    config.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const token = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.merchantCode}:${config.secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  });
  if (!token.ok) throw new Error(`PayPal authentication returned HTTP ${token.status}.`);
  const { access_token } = z.object({ access_token: z.string().min(1) }).parse(await token.json());
  return async (path: string, body?: unknown, key?: string) => {
    const response = await fetch(`${base}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(key ? { "PayPal-Request-Id": key } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`PayPal returned HTTP ${response.status}.`);
    return response.json() as Promise<unknown>;
  };
}

const referenceSchema = z.string().regex(/^[A-Z0-9]{10,35}$/);

export async function createPayPalOrder(config: ProviderConfig, order: PaymentOrder) {
  const request = await connect(config);
  const result = z
    .object({
      id: referenceSchema,
      links: z.array(z.object({ rel: z.string(), href: z.string() })),
    })
    .parse(
      await request(
        "/v2/checkout/orders",
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: order.id,
              custom_id: order.id,
              invoice_id: order.id,
              description: order.number,
              amount: { currency_code: order.currency, value: order.total.toFixed(2) },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                user_action: "PAY_NOW",
                shipping_preference: "NO_SHIPPING",
                return_url: order.returnUrl,
                cancel_url: order.returnUrl,
              },
            },
          },
        },
        order.id,
      ),
    );
  const link = result.links.find(({ rel }) => rel === "payer-action" || rel === "approve");
  if (!link) throw new Error("PayPal did not return an approval URL.");
  return { reference: result.id, url: link.href };
}

const money = z.object({
  currency_code: z.string(),
  value: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
});
const snapshot = z.object({
  id: referenceSchema,
  status: z.string(),
  intent: z.literal("CAPTURE"),
  purchase_units: z
    .array(
      z.object({
        reference_id: z.string(),
        amount: money,
        payments: z
          .object({
            captures: z.array(z.object({ status: z.string(), amount: money })).optional(),
          })
          .optional(),
      }),
    )
    .length(1),
});

export async function confirmPayPalOrder(
  config: ProviderConfig,
  expected: { reference: string; orderId: string; amount: number; currency: string },
): Promise<PaymentState> {
  const reference = referenceSchema.parse(expected.reference);
  const request = await connect(config);
  const path = `/v2/checkout/orders/${reference}`;
  const matchAmount = (value: z.infer<typeof money>) =>
    value.currency_code === expected.currency && Number(value.value) === expected.amount;
  const read = async () => {
    const order = snapshot.parse(await request(path));
    const unit = order.purchase_units[0];
    if (
      order.id !== reference ||
      unit.reference_id !== expected.orderId ||
      !matchAmount(unit.amount)
    )
      throw new Error("PayPal payment does not match the order.");
    return { order, captures: unit.payments?.captures ?? [] };
  };
  let payment = await read();
  if (payment.order.status === "APPROVED" && payment.captures.length === 0) {
    try {
      await request(`${path}/capture`, {}, expected.orderId);
    } catch (error) {
      payment = await read();
      if (!payment.captures.length) throw error;
    }
    payment = await read();
  }
  if (payment.captures.length === 1 && matchAmount(payment.captures[0].amount)) {
    if (payment.captures[0].status === "REFUNDED") return "refunded";
    if (["COMPLETED", "PARTIALLY_REFUNDED"].includes(payment.captures[0].status)) return "paid";
    if (["DECLINED", "FAILED"].includes(payment.captures[0].status)) return "failed";
  }
  return payment.order.status === "VOIDED" ? "failed" : "pending";
}

export async function verifiedPayPalNotification(
  config: ProviderConfig,
  request: Request,
  payload: unknown,
) {
  const headers = z
    .object({
      auth_algo: z.string().min(1),
      cert_url: z.url(),
      transmission_id: z.string().min(1),
      transmission_sig: z.string().min(1),
      transmission_time: z.string().min(1),
    })
    .safeParse({
      auth_algo: request.headers.get("paypal-auth-algo"),
      cert_url: request.headers.get("paypal-cert-url"),
      transmission_id: request.headers.get("paypal-transmission-id"),
      transmission_sig: request.headers.get("paypal-transmission-sig"),
      transmission_time: request.headers.get("paypal-transmission-time"),
    });
  if (
    !headers.success ||
    !new URL(headers.data.cert_url).hostname.endsWith(".paypal.com") ||
    !headers.data.cert_url.startsWith("https://")
  )
    return null;
  const event = z
    .object({
      event_type: z.string(),
      resource: z.object({
        id: z.string().optional(),
        supplementary_data: z
          .object({ related_ids: z.object({ order_id: z.string().optional() }).optional() })
          .optional(),
      }),
    })
    .safeParse(payload);
  if (!event.success) return null;
  const { event_type, resource } = event.data;
  const reference = referenceSchema.safeParse(
    event_type === "CHECKOUT.ORDER.APPROVED"
      ? resource.id
      : resource.supplementary_data?.related_ids?.order_id,
  );
  if (!reference.success) return null;
  const verify = await connect(config);
  const result = z.object({ verification_status: z.string() }).parse(
    await verify("/v1/notifications/verify-webhook-signature", {
      ...headers.data,
      webhook_id: config.webhookSecret,
      webhook_event: payload,
    }),
  );
  return result.verification_status === "SUCCESS" ? reference.data : null;
}
