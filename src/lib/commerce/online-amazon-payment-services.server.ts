import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { PaymentOrder, PaymentState, ProviderConfig } from "./online-payment-providers.server";

const flatResponse = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

function signature(fields: Record<string, string | number | boolean | null>, phrase: string) {
  const canonical = Object.keys(fields)
    .filter((key) => key !== "signature")
    .sort()
    .map((key) => `${key}=${fields[key] ?? ""}`)
    .join("");
  return createHash("sha256").update(`${phrase}${canonical}${phrase}`).digest("hex");
}

function verified(config: ProviderConfig, payload: unknown) {
  const fields = flatResponse.parse(payload);
  const supplied = fields.signature;
  const expected = signature(fields, config.webhookSecret);
  if (
    typeof supplied !== "string" ||
    !/^[a-f0-9]{64}$/i.test(supplied) ||
    !timingSafeEqual(Buffer.from(supplied.toLowerCase()), Buffer.from(expected))
  ) {
    throw new Error("Amazon Payment Services returned an invalid signature.");
  }
  if (
    fields.merchant_identifier !== config.merchantCode ||
    (fields.access_code !== undefined && fields.access_code !== config.accessCode)
  )
    throw new Error("Amazon Payment Services merchant mismatch.");
  return fields;
}

async function request(config: ProviderConfig, fields: Record<string, string | number>) {
  const body = {
    ...fields,
    merchant_identifier: config.merchantCode ?? "",
    access_code: config.accessCode ?? "",
  };
  const host =
    config.mode === "live" ? "paymentservices.payfort.com" : "sbpaymentservices.payfort.com";
  const response = await fetch(`https://${host}/FortAPI/paymentApi`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...body, signature: signature(body, config.secret) }),
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Amazon Payment Services returned HTTP ${response.status}.`);
  return verified(config, await response.json());
}

export async function createAmazonPaymentLink(
  config: ProviderConfig,
  order: PaymentOrder,
  amount: number,
) {
  const receipt = new URL(order.webhookUrl);
  receipt.searchParams.set("returnOrder", order.id);
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString().slice(0, 19) + "+00:00";
  const link = z
    .object({
      merchant_reference: z.string(),
      amount: z.coerce.number().int(),
      currency: z.string(),
      payment_link_id: z.string().min(1).max(20),
      payment_link: z.url(),
      response_code: z.literal("46000"),
    })
    .parse(
      await request(config, {
        service_command: "PAYMENT_LINK",
        link_command: "PURCHASE",
        notification_type: "NONE",
        merchant_reference: order.id,
        amount,
        currency: order.currency,
        language: "en",
        customer_email: order.buyer.email,
        request_expiry_date: expiresAt,
        order_description: order.number,
        return_url: receipt.href,
      }),
    );
  if (
    link.merchant_reference !== order.id ||
    link.amount !== amount ||
    link.currency !== order.currency
  )
    throw new Error("Amazon Payment Services link does not match the order.");
  return { reference: link.payment_link_id, url: link.payment_link };
}

export async function confirmAmazonPaymentLink(
  config: ProviderConfig,
  reference: string,
  orderId: string,
  amount: number,
  currency: string,
): Promise<PaymentState> {
  const link = z
    .object({
      payment_link_id: z.string(),
      merchant_reference: z.string(),
      amount: z.coerce.number().int(),
      currency: z.string(),
      payment_link_status: z.string(),
    })
    .parse(
      await request(config, {
        query_command: "CHECK_PAYMENT_LINK_STATUS",
        payment_link_id: reference,
      }),
    );
  if (
    link.payment_link_id !== reference ||
    link.merchant_reference !== orderId ||
    link.amount !== amount ||
    link.currency !== currency
  )
    throw new Error("Amazon Payment Services payment does not match the order.");
  const status = link.payment_link_status.toLowerCase();
  if (status === "paid") return "paid";
  return ["expired", "cancelled", "canceled", "closed"].includes(status) ? "failed" : "pending";
}

export function amazonNotificationOrder(config: ProviderConfig, request: Request, body: string) {
  try {
    const payload = request.headers.get("content-type")?.includes("application/json")
      ? (JSON.parse(body) as unknown)
      : Object.fromEntries(new URLSearchParams(body));
    return z.string().uuid().parse(verified(config, payload).merchant_reference);
  } catch {
    return null;
  }
}
