import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  ONLINE_PAYMENT_LABELS,
  type OnlinePaymentProvider,
  type PaymentMarket,
} from "./online-payment-methods";

import { confirmPayPalOrder, createPayPalOrder } from "./online-paypal.server";

import { createCheckoutComPage, confirmCheckoutComPage } from "./online-checkout-com.server";

import {
  createAmazonPaymentLink,
  confirmAmazonPaymentLink,
} from "./online-amazon-payment-services.server";

export type Market = PaymentMarket;
export type PaymentMode = "sandbox" | "live";
export type PaymentState = "pending" | "authorized" | "paid" | "failed" | "refunded";

export interface PaymentOrder {
  id: string;
  number: string;
  market: Market;
  currency: "AED" | "SAR" | "QAR" | "USD";
  total: number;
  tax: number;
  shipping: number;
  discount: number;
  buyer: { name: string; email: string; phone: string };
  address: { line1: string; line2?: string; city: string; postalCode: string; region?: string };
  items: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
    discount: number;
  }[];
  returnUrl: string;
  webhookUrl: string;
}

export interface ProviderConfig {
  provider: OnlinePaymentProvider;
  market: Market;
  hostPrefix?: string;
  accessCode?: string;
  secret: string;
  webhookSecret: string;
  merchantCode?: string;
  automaticCapture: boolean;
  mode: PaymentMode;
}

export function providerConfig(
  provider: OnlinePaymentProvider,
  workspaceId: string,
  market: Market,
): ProviderConfig | null {
  const prefix = `COMMERCE_${workspaceId.replaceAll("-", "").toUpperCase()}_${market}_${provider.toUpperCase()}`;
  const secret = process.env[`${prefix}_API_KEY`]?.trim();
  const webhookSecret =
    provider === "tap" || provider === "paytabs"
      ? secret
      : process.env[`${prefix}_WEBHOOK_SECRET`]?.trim();
  const merchantCode = process.env[`${prefix}_MERCHANT_CODE`]?.trim();
  const mode = process.env[`${prefix}_MODE`] ?? "sandbox";
  if (!secret || !webhookSecret || (mode !== "sandbox" && mode !== "live")) return null;
  if (
    provider === "tabby" &&
    (!merchantCode ||
      !secret.startsWith("sk_") ||
      (mode === "sandbox") !== secret.startsWith("sk_test_"))
  )
    return null;
  if (
    provider === "tap" &&
    (!merchantCode ||
      !/^sk_(test|live)_/.test(secret) ||
      (mode === "sandbox") !== secret.startsWith("sk_test_"))
  )
    return null;
  if ((provider === "paytabs" || provider === "telr") && !/^\d+$/.test(merchantCode ?? ""))
    return null;
  if (provider === "paypal" && !merchantCode) return null;
  const hostPrefix = process.env[`${prefix}_HOST_PREFIX`]?.trim();
  if (
    provider === "checkoutcom" &&
    (!/^pc_[a-z0-9]{26}$/.test(merchantCode ?? "") || !/^[a-z0-9]{3,40}$/.test(hostPrefix ?? ""))
  )
    return null;
  const accessCode = process.env[`${prefix}_ACCESS_CODE`]?.trim();
  if (
    provider === "amazonpayservices" &&
    (!/^[a-zA-Z0-9]{1,20}$/.test(merchantCode ?? "") ||
      !/^[a-zA-Z0-9]{1,20}$/.test(accessCode ?? ""))
  )
    return null;
  return {
    market,
    hostPrefix,
    accessCode,
    provider,
    secret,
    webhookSecret,
    merchantCode,
    mode,
    automaticCapture: process.env[`${prefix}_AUTO_CAPTURE`] === "true",
  };
}

export class CheckoutRejectedError extends Error {}

export function minorUnits(amount: number): number {
  const result = Math.round(amount * 100);
  if (!Number.isSafeInteger(result) || result < 0 || Math.abs(result - amount * 100) > 0.00001) {
    throw new Error("Payment amount must have at most two decimal places.");
  }
  return result;
}

const providerAmount = z
  .union([z.string().regex(/^\d+(?:\.\d{1,2})?$/), z.number().nonnegative()])
  .transform((value) => minorUnits(Number(value)));

function decimal(amount: number) {
  return (minorUnits(amount) / 100).toFixed(2);
}

async function providerRequest(
  config: ProviderConfig,
  path: string,
  body?: unknown,
): Promise<unknown> {
  if (
    config.provider === "paypal" ||
    config.provider === "checkoutcom" ||
    config.provider === "amazonpayservices"
  )
    throw new Error("This provider uses a dedicated API client.");
  const base = {
    tabby: "https://api.tabby.ai",
    tamara: config.mode === "live" ? "https://api.tamara.co" : "https://api-sandbox.tamara.co",
    tap: "https://api.tap.company",
    telr: "https://secure.telr.com",
    myfatoorah:
      config.mode === "sandbox"
        ? "https://apitest.myfatoorah.com"
        : config.market === "SA"
          ? "https://api-sa.myfatoorah.com"
          : config.market === "QA"
            ? "https://api-qa.myfatoorah.com"
            : "https://api-ae.myfatoorah.com",
    paytabs:
      config.market === "SA"
        ? "https://secure.paytabs.sa"
        : config.market === "QA"
          ? "https://secure-doha.paytabs.com"
          : "https://secure.paytabs.com",
  }[config.provider];
  const res = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Accept: "application/json",
      Authorization: config.provider === "paytabs" ? config.secret : `Bearer ${config.secret}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  });
  const message = `${ONLINE_PAYMENT_LABELS[config.provider]} returned HTTP ${res.status}.`;
  if (res.status === 400 || res.status === 422) throw new CheckoutRejectedError(message);
  if (!res.ok) throw new Error(message);
  return res.json();
}

function checkoutUrl(provider: OnlinePaymentProvider, value: string): string {
  const url = new URL(value);
  const domains = {
    tabby: ["tabby.ai"],
    tamara: ["tamara.co"],
    tap: ["tap.company", "tapgateway.com"],
    paytabs: ["paytabs.com", "paytabs.sa"],
    myfatoorah: ["myfatoorah.com"],
    paypal: ["paypal.com"],
    checkoutcom: ["checkout.com"],
    telr: ["telr.com"],
    amazonpayservices: ["payfort.com"],
  }[provider];
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !domains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
  ) {
    throw new Error("The payment provider returned an unexpected checkout address.");
  }
  return url.href;
}

function tabbyItems(order: PaymentOrder) {
  return order.items.map((item) => ({
    title: item.name,
    quantity: item.quantity,
    unit_price: decimal(item.unitPrice),
    reference_id: item.sku,
  }));
}

function returnUrls(order: PaymentOrder) {
  return { success: order.returnUrl, cancel: order.returnUrl, failure: order.returnUrl };
}

export async function createProviderCheckout(config: ProviderConfig, order: PaymentOrder) {
  if (config.provider === "amazonpayservices") {
    const session = await createAmazonPaymentLink(config, order, minorUnits(order.total));
    return { ...session, url: checkoutUrl(config.provider, session.url) };
  }
  if (config.provider === "checkoutcom") {
    const session = await createCheckoutComPage(config, order, minorUnits(order.total));
    return { ...session, url: checkoutUrl(config.provider, session.url) };
  }
  if (config.provider === "paypal") {
    const session = await createPayPalOrder(config, order);
    return { ...session, url: checkoutUrl(config.provider, session.url) };
  }
  if (config.provider === "tabby") {
    const session = z
      .object({
        status: z.string(),
        payment: z.object({ id: z.string().uuid() }).nullish(),
        configuration: z
          .object({
            available_products: z
              .object({ installments: z.array(z.object({ web_url: z.string() })).nullish() })
              .nullish(),
          })
          .nullish(),
      })
      .parse(
        await providerRequest(config, "/api/v2/checkout", {
          payment: {
            amount: decimal(order.total),
            currency: order.currency,
            description: order.number,
            buyer: order.buyer,
            shipping_address: {
              address: [order.address.line1, order.address.line2].filter(Boolean).join(", "),
              city: order.address.city,
              zip: order.address.postalCode,
            },
            order: {
              reference_id: order.id,
              items: tabbyItems(order),
              tax_amount: decimal(order.tax),
              shipping_amount: decimal(order.shipping),
              discount_amount: decimal(order.discount),
            },
          },
          lang: "en",
          merchant_code: config.merchantCode,
          merchant_urls: returnUrls(order),
        }),
      );
    if (session.status === "rejected")
      throw new CheckoutRejectedError("Tabby declined installments for this order.");
    const url = session.configuration?.available_products?.installments?.[0]?.web_url;
    if (!session.payment || !url) throw new Error("Tabby did not return an installment checkout.");
    return { reference: session.payment.id, url: checkoutUrl(config.provider, url) };
  }

  if (config.provider === "tap") {
    const countryCode = order.market === "AE" ? "971" : order.market === "QA" ? "974" : "966";
    const localPhone = order.buyer.phone
      .replace(/[^0-9]/g, "")
      .replace(new RegExp(`^(?:00)?${countryCode}`), "")
      .replace(/^0/, "");
    const charge = z
      .object({
        id: z.string().regex(/^chg_[a-zA-Z0-9_-]+$/),
        transaction: z.object({ url: z.string() }),
      })
      .parse(
        await providerRequest(config, "/v2/charges", {
          amount: minorUnits(order.total) / 100,
          currency: order.currency,
          customer_initiated: true,
          threeDSecure: true,
          save_card: false,
          description: order.number,
          source: { id: "src_all" },
          merchant: { id: config.merchantCode },
          customer: {
            first_name: order.buyer.name,
            email: order.buyer.email,
            phone: { country_code: countryCode, number: localPhone },
          },
          reference: { order: order.id, transaction: order.id, idempotent: order.id },
          redirect: { url: order.returnUrl },
          post: { url: order.webhookUrl },
        }),
      );
    return { reference: charge.id, url: checkoutUrl(config.provider, charge.transaction.url) };
  }

  if (config.provider === "paytabs") {
    const receipt = new URL(order.webhookUrl);
    receipt.searchParams.set("returnOrder", order.id);
    const session = z
      .object({ tran_ref: z.string().regex(/^[a-zA-Z0-9_-]+$/), redirect_url: z.string() })
      .parse(
        await providerRequest(config, "/payment/request", {
          profile_id: Number(config.merchantCode),
          tran_type: "sale",
          tran_class: "ecom",
          cart_id: order.id,
          cart_currency: order.currency,
          cart_amount: minorUnits(order.total) / 100,
          cart_description: order.number,
          callback: order.webhookUrl,
          return: receipt.href,
          customer_details: {
            name: order.buyer.name,
            email: order.buyer.email,
            phone: order.buyer.phone,
            street1: order.address.line1,
            city: order.address.city,
            state: order.address.region ?? order.address.city,
            zip: order.address.postalCode,
            country: order.market,
          },
        }),
      );
    return { reference: session.tran_ref, url: checkoutUrl(config.provider, session.redirect_url) };
  }

  if (config.provider === "myfatoorah") {
    const invoice = z
      .object({
        IsSuccess: z.literal(true),
        Data: z.object({ InvoiceId: z.number().int().positive(), InvoiceURL: z.string() }),
      })
      .parse(
        await providerRequest(config, "/v2/SendPayment", {
          InvoiceValue: minorUnits(order.total) / 100,
          CustomerName: order.buyer.name,
          CustomerEmail: order.buyer.email,
          NotificationOption: "LNK",
          DisplayCurrencyIso: order.currency,
          Language: "EN",
          CustomerReference: order.id,
          CallBackUrl: order.returnUrl,
          ErrorUrl: order.returnUrl,
          WebhookUrl: order.webhookUrl,
        }),
      );
    return {
      reference: String(invoice.Data.InvoiceId),
      url: checkoutUrl(config.provider, invoice.Data.InvoiceURL),
    };
  }

  if (config.provider === "telr") {
    const checkout = z
      .object({ order: z.object({ ref: z.string().min(1).max(150), url: z.string() }) })
      .parse(
        await providerRequest(config, "/gateway/order.json", {
          method: "create",
          store: Number(config.merchantCode),
          authkey: config.secret,
          framed: 0,
          order: {
            cartid: order.id,
            test: config.mode === "sandbox" ? 1 : 0,
            amount: decimal(order.total),
            currency: order.currency,
            description: order.number,
            trantype: "sale",
          },
          return: {
            authorised: order.returnUrl,
            cancelled: order.returnUrl,
            declined: order.returnUrl,
          },
        }),
      );
    return { reference: checkout.order.ref, url: checkoutUrl(config.provider, checkout.order.url) };
  }

  const [firstName, ...remainingNames] = order.buyer.name.trim().split(/\s+/);
  const lastName = remainingNames.join(" ");
  if (!firstName || !lastName)
    throw new CheckoutRejectedError("Tamara requires a first and last name.");
  const money = (amount: number) => ({
    amount: minorUnits(amount) / 100,
    currency: order.currency,
  });
  const consumer = { first_name: firstName, last_name: lastName, phone_number: order.buyer.phone };
  const address = {
    ...consumer,
    line1: order.address.line1,
    line2: order.address.line2,
    city: order.address.city,
    region: order.address.region,
    country_code: order.market,
  };
  const session = z.object({ order_id: z.string().uuid(), checkout_url: z.string() }).parse(
    await providerRequest(config, "/checkout", {
      total_amount: money(order.total),
      shipping_amount: money(order.shipping),
      tax_amount: money(order.tax),
      order_reference_id: order.id,
      order_number: order.number,
      country_code: order.market,
      description: order.number,
      consumer: { ...consumer, email: order.buyer.email },
      shipping_address: address,
      merchant_url: { ...returnUrls(order), notification: order.webhookUrl },
      locale: "en_US",
      platform: "Cyloo",
      risk_assessment: {},
      items: order.items.map((item) => ({
        name: item.name.slice(0, 255),
        quantity: item.quantity,
        reference_id: item.id,
        sku: item.sku.slice(0, 128),
        type: "Physical",
        unit_price: money(item.unitPrice),
        total_amount: money(item.total),
      })),
      discount:
        order.discount > 0 ? { name: "Order discount", amount: money(order.discount) } : undefined,
    }),
  );
  return { reference: session.order_id, url: checkoutUrl(config.provider, session.checkout_url) };
}

const tabbyPayment = z.object({
  id: z.string().uuid(),
  currency: z.string(),
  amount: providerAmount,
  status: z.string(),
  is_test: z.boolean(),
  order: z.object({ reference_id: z.string() }),
  captures: z.array(z.object({ amount: providerAmount })).nullish(),
  refunds: z.array(z.object({ amount: providerAmount })).nullish(),
});
const tamaraPayment = z.object({
  order_id: z.string().uuid(),
  order_reference_id: z.string(),
  status: z.string(),
  total_amount: z.object({ currency: z.string(), amount: providerAmount }),
});

interface ExpectedPayment {
  reference: string;
  orderId: string;
  amount: number;
  currency: string;
  tax: number;
  shipping: number;
  discount: number;
}

export async function confirmProviderPayment(
  config: ProviderConfig,
  expected: ExpectedPayment,
): Promise<PaymentState> {
  if (config.provider === "amazonpayservices") {
    return confirmAmazonPaymentLink(
      config,
      expected.reference,
      expected.orderId,
      minorUnits(expected.amount),
      expected.currency,
    );
  }
  if (config.provider === "checkoutcom")
    return confirmCheckoutComPage(
      config,
      expected.reference,
      expected.orderId,
      minorUnits(expected.amount),
      expected.currency,
    );
  if (config.provider === "paypal") return confirmPayPalOrder(config, expected);
  const id = encodeURIComponent(expected.reference);
  const amount = minorUnits(expected.amount);
  if (config.provider === "tabby") {
    const read = async () => {
      const payment = tabbyPayment.parse(await providerRequest(config, `/api/v2/payments/${id}`));
      if (
        payment.id !== expected.reference ||
        payment.order.reference_id !== expected.orderId ||
        payment.amount !== amount ||
        payment.currency !== expected.currency ||
        payment.is_test !== (config.mode === "sandbox")
      ) {
        throw new Error("Tabby payment does not match the order.");
      }
      return payment;
    };
    let payment = await read();
    const captured = () => (payment.captures ?? []).reduce((sum, next) => sum + next.amount, 0);
    if (payment.status === "AUTHORIZED" && captured() === 0 && config.automaticCapture) {
      try {
        await providerRequest(config, `/api/v2/payments/${id}/captures`, {
          amount: decimal(expected.amount),
          reference_id: expected.orderId,
          tax_amount: decimal(expected.tax),
          shipping_amount: decimal(expected.shipping),
          discount_amount: decimal(expected.discount),
        });
      } catch (error) {
        payment = await read();
        if (captured() !== amount) throw error;
      }
      payment = await read();
    }
    if ((payment.refunds ?? []).reduce((sum, next) => sum + next.amount, 0) === amount)
      return "refunded";
    if (captured() === amount) return "paid";
    if (payment.status === "AUTHORIZED" || captured() > 0) return "authorized";
    return ["REJECTED", "EXPIRED", "CLOSED"].includes(payment.status) ? "failed" : "pending";
  }

  if (config.provider === "tap") {
    const charge = z
      .object({
        id: z.string(),
        amount: providerAmount,
        currency: z.string(),
        status: z.string(),
        live_mode: z.boolean(),
        reference: z.object({ order: z.string() }),
        merchant: z.object({ id: z.coerce.string() }),
      })
      .parse(await providerRequest(config, `/v2/charges/${id}`));
    if (
      charge.id !== expected.reference ||
      charge.reference.order !== expected.orderId ||
      charge.amount !== amount ||
      charge.currency !== expected.currency ||
      charge.merchant.id !== config.merchantCode ||
      charge.live_mode !== (config.mode === "live")
    )
      throw new Error("Tap charge does not match the order.");
    if (charge.status === "CAPTURED") return "paid";
    return ["INITIATED", "IN_PROGRESS", "PENDING", "UNKNOWN"].includes(charge.status)
      ? "pending"
      : "failed";
  }

  if (config.provider === "paytabs") {
    const transaction = z
      .object({
        tran_ref: z.string(),
        cart_id: z.string(),
        cart_currency: z.string(),
        cart_amount: providerAmount,
        tran_type: z.string(),
        profileId: z.coerce.string().optional(),
        payment_result: z.object({ response_status: z.string() }),
      })
      .parse(
        await providerRequest(config, "/payment/query", {
          profile_id: Number(config.merchantCode),
          tran_ref: expected.reference,
        }),
      );
    if (
      transaction.tran_ref !== expected.reference ||
      transaction.cart_id !== expected.orderId ||
      transaction.cart_currency !== expected.currency ||
      transaction.cart_amount !== amount ||
      transaction.tran_type.toLowerCase() !== "sale" ||
      transaction.tran_ref.startsWith("TST") !== (config.mode === "sandbox") ||
      (transaction.profileId && transaction.profileId !== config.merchantCode)
    )
      throw new Error("PayTabs transaction does not match the order.");
    if (transaction.payment_result.response_status === "A") return "paid";
    return ["D", "E", "V"].includes(transaction.payment_result.response_status)
      ? "failed"
      : "pending";
  }

  if (config.provider === "myfatoorah") {
    const { Data: invoice } = z
      .object({
        IsSuccess: z.literal(true),
        Data: z.object({
          InvoiceId: z.number().int().positive(),
          CustomerReference: z.string(),
          InvoiceValue: providerAmount,
          InvoiceStatus: z.string(),
          InvoiceTransactions: z
            .array(z.object({ TransactionStatus: z.string(), Currency: z.string().nullish() }))
            .nullish(),
        }),
      })
      .parse(
        await providerRequest(config, "/v2/GetPaymentStatus", {
          Key: expected.reference,
          KeyType: "InvoiceId",
        }),
      );
    if (
      String(invoice.InvoiceId) !== expected.reference ||
      invoice.CustomerReference !== expected.orderId ||
      invoice.InvoiceValue !== amount
    )
      throw new Error("MyFatoorah invoice does not match the order.");
    if (invoice.InvoiceStatus.toLowerCase() === "paid") {
      const successful = invoice.InvoiceTransactions?.find(
        (transaction) =>
          transaction.TransactionStatus.toUpperCase() === "SUCCESS" &&
          transaction.Currency === expected.currency,
      );
      if (!successful) throw new Error("MyFatoorah did not confirm the order currency.");
      return "paid";
    }
    return ["canceled", "cancelled", "expired"].includes(invoice.InvoiceStatus.toLowerCase())
      ? "failed"
      : "pending";
  }

  if (config.provider === "telr") {
    const { order } = z
      .object({
        order: z.object({
          ref: z.string(),
          cartid: z.string(),
          test: z.coerce.number(),
          amount: providerAmount,
          currency: z.string(),
          status: z.object({ code: z.coerce.number().int() }),
        }),
      })
      .parse(
        await providerRequest(config, "/gateway/order.json", {
          method: "check",
          store: Number(config.merchantCode),
          authkey: config.secret,
          order: { ref: expected.reference },
        }),
      );
    if (
      order.ref !== expected.reference ||
      order.cartid !== expected.orderId ||
      order.amount !== amount ||
      order.currency !== expected.currency ||
      order.test !== (config.mode === "sandbox" ? 1 : 0)
    )
      throw new Error("Telr payment does not match the order.");
    if (order.status.code === 3) return "paid";
    if (order.status.code === 2) return "authorized";
    return order.status.code < 0 ? "failed" : "pending";
  }

  const read = async () => {
    const order = tamaraPayment.parse(await providerRequest(config, `/orders/${id}`));
    if (
      order.order_id !== expected.reference ||
      order.order_reference_id !== expected.orderId ||
      order.total_amount.amount !== amount ||
      order.total_amount.currency !== expected.currency
    ) {
      throw new Error("Tamara payment does not match the order.");
    }
    return order;
  };
  let order = await read();
  if (order.status === "approved") {
    try {
      await providerRequest(config, `/orders/${id}/authorise`, {});
    } catch (error) {
      order = await read();
      if (order.status === "approved") throw error;
    }
    order = await read();
  }
  if (order.status === "fully_refunded") return "refunded";
  if (["fully_captured", "partially_refunded"].includes(order.status)) return "paid";
  if (["authorised", "partially_captured"].includes(order.status)) return "authorized";
  return ["canceled", "declined", "expired"].includes(order.status) ? "failed" : "pending";
}

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function requestProviderFullRefund(
  config: ProviderConfig,
  expected: Pick<ExpectedPayment, "reference" | "orderId" | "amount" | "currency">,
) {
  const id = encodeURIComponent(expected.reference);
  const amount = minorUnits(expected.amount);
  const refundId = `refund-${expected.orderId}`;
  if (config.provider === "tabby") {
    const payment = tabbyPayment.parse(await providerRequest(config, `/api/v2/payments/${id}`));
    if (
      payment.id !== expected.reference ||
      payment.order.reference_id !== expected.orderId ||
      payment.currency !== expected.currency ||
      payment.amount !== amount ||
      payment.is_test !== (config.mode === "sandbox") ||
      (payment.captures ?? []).reduce((total, capture) => total + capture.amount, 0) !== amount ||
      payment.refunds?.length
    ) {
      throw new Error("Tabby must confirm that the full payment is captured and has no refunds.");
    }
    await providerRequest(config, `/api/v2/payments/${id}/refunds`, {
      amount: decimal(expected.amount),
      reference_id: refundId,
      reason: "Full order refund",
    });
    return;
  }
  if (config.provider === "tamara") {
    const order = tamaraPayment.parse(await providerRequest(config, `/orders/${id}`));
    if (
      order.order_id !== expected.reference ||
      order.order_reference_id !== expected.orderId ||
      order.total_amount.amount !== amount ||
      order.total_amount.currency !== expected.currency ||
      order.status !== "fully_captured"
    ) {
      throw new Error("Tamara must confirm that the full payment is captured and has no refunds.");
    }
    await providerRequest(config, `/payments/simplified-refund/${id}`, {
      total_amount: { amount: amount / 100, currency: expected.currency },
      comment: "Full order refund",
      merchant_refund_id: refundId,
    });
    return;
  }
  throw new Error("Refunds for this provider are managed in its merchant dashboard.");
}

export function verifyProviderNotification(
  config: ProviderConfig,
  request: Request,
  rawBody: string,
): boolean {
  if (config.provider === "tabby")
    return equal(request.headers.get("x-cyloo-webhook-token") ?? "", config.webhookSecret);
  if (config.provider === "telr") {
    const fields = new URLSearchParams(rawBody);
    if (
      fields.get("tran_store") !== config.merchantCode ||
      fields.get("tran_test") !== (config.mode === "sandbox" ? "1" : "0")
    )
      return false;
    const order =
      "tran_store,tran_type,tran_class,tran_test,tran_ref,tran_prevref,tran_firstref,tran_order,tran_currency,tran_amount,tran_cartid,tran_desc,tran_status,tran_authcode,tran_authmessage".split(
        ",",
      );
    const signature = createHash("sha1")
      .update(
        [config.webhookSecret, ...order.map((field) => fields.get(field)?.trim() ?? "")].join(":"),
      )
      .digest("hex");
    return equal(fields.get("tran_check")?.toLowerCase() ?? "", signature);
  }
  if (config.provider === "checkoutcom") {
    return equal(
      request.headers.get("cko-signature") ?? "",
      createHmac("sha256", config.webhookSecret).update(rawBody).digest("hex"),
    );
  }
  if (config.provider === "paytabs") {
    const provided = request.headers.get("signature") ?? "";
    return equal(provided, createHmac("sha256", config.secret).update(rawBody).digest("hex"));
  }
  if (config.provider === "tap") {
    try {
      const charge = z
        .object({
          id: z.string(),
          amount: z.number(),
          currency: z.string(),
          status: z.string(),
          reference: z.object({ gateway: z.string().nullish(), payment: z.string().nullish() }),
          transaction: z.object({ created: z.union([z.string(), z.number()]) }),
        })
        .parse(JSON.parse(rawBody));
      const content = `x_id${charge.id}x_amount${decimal(charge.amount)}x_currency${charge.currency}x_gateway_reference${charge.reference.gateway ?? ""}x_payment_reference${charge.reference.payment ?? ""}x_status${charge.status}x_created${charge.transaction.created}`;
      return equal(
        request.headers.get("hashstring") ?? "",
        createHmac("sha256", config.secret).update(content).digest("hex"),
      );
    } catch {
      return false;
    }
  }
  if (config.provider === "myfatoorah") {
    try {
      const event = z
        .object({
          Data: z.object({
            Invoice: z.object({
              Id: z.union([z.string(), z.number()]),
              Status: z.string(),
              ExternalIdentifier: z.string().nullish(),
            }),
            Transaction: z.object({ Status: z.string(), PaymentId: z.string().nullish() }),
          }),
        })
        .parse(JSON.parse(rawBody)).Data;
      const message = `Invoice.Id=${event.Invoice.Id},Invoice.Status=${event.Invoice.Status},Transaction.Status=${event.Transaction.Status},Transaction.PaymentId=${event.Transaction.PaymentId ?? ""},Invoice.ExternalIdentifier=${event.Invoice.ExternalIdentifier ?? ""}`;
      return equal(
        request.headers.get("myfatoorah-signature") ?? "",
        createHmac("sha256", config.webhookSecret).update(message).digest("base64"),
      );
    } catch {
      return false;
    }
  }
  if (config.provider !== "tamara") return false;
  const bearer = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  const token = bearer ?? new URL(request.url).searchParams.get("tamaraToken");
  const [header, payload, signature, ...extra] = token?.split(".") ?? [];
  if (!header || !payload || !signature || extra.length) return false;
  try {
    if (JSON.parse(Buffer.from(header, "base64url").toString()).alg !== "HS256") return false;
    const expected = createHmac("sha256", config.webhookSecret)
      .update(`${header}.${payload}`)
      .digest("base64url");
    if (!equal(signature, expected)) return false;
    const claims = z
      .object({ exp: z.number().optional(), nbf: z.number().optional() })
      .parse(JSON.parse(Buffer.from(payload, "base64url").toString()));
    const now = Math.floor(Date.now() / 1000);
    return (
      (claims.exp === undefined || claims.exp > now) &&
      (claims.nbf === undefined || claims.nbf <= now)
    );
  } catch {
    return false;
  }
}
