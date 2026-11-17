import { z } from "zod";
import type { PaymentOrder, PaymentState, ProviderConfig } from "./online-payment-providers.server";

const hostedId = z.string().regex(/^hpp_[A-Za-z0-9_-]{12}$/);
const paymentId = z.string().regex(/^pay_[a-z0-9]{26}$/);

async function checkoutRequest(config: ProviderConfig, path: string, body?: unknown) {
  const prefix = z
    .string()
    .regex(/^[a-z0-9]{3,40}$/)
    .parse(config.hostPrefix);
  const host =
    config.mode === "live" ? `${prefix}.api.checkout.com` : `${prefix}.api.sandbox.checkout.com`;
  const response = await fetch(`https://${host}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${config.secret}`,
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Checkout.com returned HTTP ${response.status}.`);
  return response.json() as Promise<unknown>;
}

// A full UUID encoded in base 36 stays within the provider's 30-character Amex limit.
function orderReference(id: string) {
  return BigInt(`0x${id.replaceAll("-", "")}`).toString(36);
}

export async function createCheckoutComPage(
  config: ProviderConfig,
  order: PaymentOrder,
  amount: number,
) {
  const session = z
    .object({ id: hostedId, _links: z.object({ redirect: z.object({ href: z.url() }) }) })
    .parse(
      await checkoutRequest(config, "/hosted-payments", {
        amount,
        currency: order.currency,
        reference: orderReference(order.id),
        description: order.number,
        processing_channel_id: config.merchantCode,
        capture: true,
        "3ds": { enabled: true },
        customer: { name: order.buyer.name, email: order.buyer.email },
        billing: {
          address: {
            address_line1: order.address.line1,
            address_line2: order.address.line2,
            city: order.address.city,
            state: order.address.region,
            zip: order.address.postalCode,
            country: order.market,
          },
        },
        success_url: order.returnUrl,
        failure_url: order.returnUrl,
        cancel_url: order.returnUrl,
        metadata: { cyloo_order_id: order.id },
      }),
    );
  return { reference: session.id, url: session._links.redirect.href };
}

export async function confirmCheckoutComPage(
  config: ProviderConfig,
  reference: string,
  orderId: string,
  amount: number,
  currency: string,
): Promise<PaymentState> {
  const page = z
    .object({
      id: hostedId,
      reference: z.string(),
      amount: z.number().int(),
      currency: z.string(),
      status: z.string(),
    })
    .parse(await checkoutRequest(config, `/hosted-payments/${hostedId.parse(reference)}`));
  if (
    page.id !== reference ||
    page.reference !== orderReference(orderId) ||
    page.amount !== amount ||
    page.currency !== currency
  )
    throw new Error("Checkout.com page does not match the order.");
  // A page status alone cannot confirm capture. Only the underlying payment can.
  return "pending";
}

export async function checkoutComPaymentDetails(config: ProviderConfig, payload: unknown) {
  const event = z
    .object({ data: z.object({ id: z.string().optional(), payment_id: z.string().optional() }) })
    .safeParse(payload);
  if (!event.success) return null;
  const id = paymentId.safeParse(event.data.data.payment_id ?? event.data.data.id);
  if (!id.success) return null;
  const payment = z
    .object({
      id: paymentId,
      amount: z.number().int(),
      currency: z.string(),
      status: z.string(),
      reference: z.string(),
      processing_channel_id: z.string().optional(),
      metadata: z.object({ cyloo_order_id: z.string().uuid().optional() }).nullish(),
      balances: z
        .object({ total_captured: z.number().int(), total_refunded: z.number().int() })
        .optional(),
    })
    .parse(await checkoutRequest(config, `/payments/${id.data}`));
  const orderId = payment.metadata?.cyloo_order_id;
  if (!orderId) return null;
  if (
    payment.id !== id.data ||
    payment.reference !== orderReference(orderId) ||
    (payment.processing_channel_id && payment.processing_channel_id !== config.merchantCode)
  )
    throw new Error("Checkout.com payment does not match the merchant and order.");
  const state: PaymentState =
    payment.amount > 0 && payment.balances?.total_refunded === payment.amount
      ? "refunded"
      : payment.amount > 0 && payment.balances?.total_captured === payment.amount
        ? "paid"
        : ["Declined", "Canceled", "Voided", "Expired"].includes(payment.status)
          ? "failed"
          : payment.status === "Authorized"
            ? "authorized"
            : "pending";
  return { orderId, amount: payment.amount, currency: payment.currency, state };
}
