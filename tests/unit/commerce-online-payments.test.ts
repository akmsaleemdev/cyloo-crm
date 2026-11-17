import { createHash, createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  confirmProviderPayment,
  createProviderCheckout,
  minorUnits,
  requestProviderFullRefund,
  verifyProviderNotification,
  type PaymentOrder,
  type ProviderConfig,
} from "@/lib/commerce/online-payment-providers.server";
import { onlinePaymentMarket } from "@/lib/commerce/online-payment-methods";
import { commerceGatewayReadiness } from "@/lib/commerce/online-payments.server";
import { checkoutComPaymentDetails } from "@/lib/commerce/online-checkout-com.server";
import { paddleProvider } from "@/lib/billing/providers/paddle";
import { getBillingProvider, listBillingProviders } from "@/lib/billing/providers";
import { defaultGatewayId, enabledGatewayIds } from "@/lib/billing/gateway-guard.server";

const id = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const reference = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const order: PaymentOrder = {
  id,
  number: "ORD-2026-000014",
  market: "AE",
  currency: "AED",
  total: 120.5,
  tax: 5.5,
  shipping: 15,
  discount: 10,
  buyer: { name: "Test Customer", email: "buyer@example.test", phone: "+971500000000" },
  address: { line1: "Test Street", city: "Dubai", postalCode: "00000" },
  items: [
    {
      id: "line-1",
      name: "Test Product",
      sku: "SKU-1",
      unitPrice: 110,
      total: 110,
      discount: 10,
      quantity: 1,
    },
  ],
  returnUrl: "https://app.example.test/order",
  webhookUrl: "https://app.example.test/webhook",
};

const config = (provider: ProviderConfig["provider"]): ProviderConfig => ({
  provider,
  market: "AE",
  secret: "fixture-key",
  webhookSecret: "fixture-webhook",
  merchantCode: provider === "paytabs" ? "123" : "fixture-merchant",
  mode: "sandbox",
  automaticCapture: true,
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function responses(...fixtures: unknown[]) {
  const fetch = vi.fn();
  fixtures.forEach((fixture) => fetch.mockResolvedValueOnce(Response.json(fixture)));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("online checkout gateway contracts", () => {
  it("keeps retired and placeholder providers out of default and enabled billing when stale rows remain", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [
          { provider_id: "mollie", enabled: true, is_default: true },
          { provider_id: "paystack", enabled: true, is_default: false },
          { provider_id: "stripe", enabled: true, is_default: false },
        ],
      }),
    };
    await expect(enabledGatewayIds(supabase)).resolves.toEqual(["stripe"]);
    await expect(defaultGatewayId(supabase)).resolves.toBe("stripe");
    expect(listBillingProviders().map(({ id }) => id)).not.toContain("paystack");
    expect(getBillingProvider("paystack").id).toBe("paystack");
    expect(getBillingProvider("mollie").supports.checkout).toBe(false);
  });

  it("reports only validated merchant market and mode without returning merchant credentials", () => {
    const prefix = `COMMERCE_${id.replaceAll("-", "").toUpperCase()}`;
    vi.stubEnv("APP_ORIGIN", "https://app.example.test");
    vi.stubEnv("APP_MODE", "production");
    vi.stubEnv(`${prefix}_AE_TABBY_API_KEY`, "sk_test_checkout-fixture");
    vi.stubEnv(`${prefix}_AE_TABBY_MERCHANT_CODE`, "fixture-merchant");
    vi.stubEnv(`${prefix}_AE_TABBY_WEBHOOK_SECRET`, "fixture-webhook");
    vi.stubEnv(`${prefix}_KW_TAMARA_API_KEY`, "fixture-key");
    vi.stubEnv(`${prefix}_KW_TAMARA_WEBHOOK_SECRET`, "fixture-webhook");
    expect(commerceGatewayReadiness().slice(0, 2)).toEqual([
      { provider: "tabby", markets: [{ country: "AE", mode: "sandbox" }] },
      { provider: "tamara", markets: [] },
    ]);
  });

  it("preserves two-decimal order totals and rejects currencies outside the supported market", () => {
    expect(minorUnits(120.5)).toBe(12050);
    expect(() => minorUnits(1.001)).toThrow();
    expect(onlinePaymentMarket("AE", "AED")).toBe("AE");
    expect(onlinePaymentMarket("SA", "AED")).toBeNull();
    expect(onlinePaymentMarket("KW", "KWD")).toBeNull();
  });

  it("creates a Tabby hosted session with the real order reference and rejects unexpected hosts", async () => {
    const response = (web_url: string) => ({
      status: "created",
      payment: { id: reference },
      configuration: { available_products: { installments: [{ web_url }] } },
    });
    const fetch = responses(
      response("https://checkout.tabby.ai/pay"),
      response("https://unrelated.example.test/"),
    );
    await expect(createProviderCheckout(config("tabby"), order)).resolves.toEqual({
      reference,
      url: "https://checkout.tabby.ai/pay",
    });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      payment: { amount: "120.50", currency: "AED", order: { reference_id: id } },
      merchant_code: "fixture-merchant",
    });
    await expect(createProviderCheckout(config("tabby"), order)).rejects.toThrow(
      "unexpected checkout address",
    );
  });

  it("captures a verified Tabby authorization with a stable reference and confirms the captured balance", async () => {
    const authorized = {
      id: reference,
      currency: "AED",
      amount: "120.50",
      status: "AUTHORIZED",
      is_test: true,
      order: { reference_id: id },
      captures: [],
      refunds: [],
    };
    const fetch = responses(
      authorized,
      {},
      { ...authorized, status: "CLOSED", captures: [{ amount: "120.50" }] },
    );
    await expect(
      confirmProviderPayment(config("tabby"), {
        ...order,
        reference,
        orderId: id,
        amount: order.total,
      }),
    ).resolves.toBe("paid");
    expect(fetch.mock.calls[1][0]).toBe(
      `https://api.tabby.ai/api/v2/payments/${reference}/captures`,
    );
    expect(JSON.parse(fetch.mock.calls[1][1].body).reference_id).toBe(id);
  });

  it("keeps a Tamara authorization distinct from a captured payment", async () => {
    const checkout = { order_id: reference, checkout_url: "https://checkout.tamara.co/pay" };
    const approved = {
      order_id: reference,
      order_reference_id: id,
      status: "approved",
      total_amount: { amount: order.total, currency: order.currency },
    };
    const fetch = responses(checkout, approved, {}, { ...approved, status: "authorised" });
    await expect(createProviderCheckout(config("tamara"), order)).resolves.toMatchObject({
      reference,
    });
    await expect(
      confirmProviderPayment(config("tamara"), {
        ...order,
        reference,
        orderId: id,
        amount: order.total,
      }),
    ).resolves.toBe("authorized");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      order_reference_id: id,
      total_amount: { amount: 120.5, currency: "AED" },
      country_code: "AE",
    });
    expect(fetch.mock.calls[2][0]).toBe(
      `https://api-sandbox.tamara.co/orders/${reference}/authorise`,
    );
  });

  it("verifies the Tap merchant, currency and reference before recording capture", async () => {
    const charge = {
      id: "chg_TEST1",
      currency: "AED",
      amount: 120.5,
      status: "CAPTURED",
      live_mode: false,
      reference: { order: id },
      merchant: { id: "fixture-merchant" },
    };
    responses({ ...charge, transaction: { url: "https://checkout.tap.company/pay" } }, charge, {
      ...charge,
      currency: "SAR",
    });
    await expect(createProviderCheckout(config("tap"), order)).resolves.toMatchObject({
      reference: charge.id,
    });
    const expected = { ...order, reference: charge.id, orderId: id, amount: order.total };
    await expect(confirmProviderPayment(config("tap"), expected)).resolves.toBe("paid");
    await expect(confirmProviderPayment(config("tap"), expected)).rejects.toThrow("does not match");
  });

  it("checks a PayTabs sale with its regional profile and prevents sandbox-to-live settlement", async () => {
    const payment = {
      tran_ref: "TST123",
      cart_id: id,
      cart_currency: "AED",
      cart_amount: "120.50",
      tran_type: "Sale",
      profileId: 123,
      payment_result: { response_status: "A" },
    };
    const fetch = responses(
      { tran_ref: payment.tran_ref, redirect_url: "https://secure.paytabs.com/pay" },
      payment,
      payment,
    );
    await expect(createProviderCheckout(config("paytabs"), order)).resolves.toMatchObject({
      reference: payment.tran_ref,
    });
    const expected = { ...order, reference: payment.tran_ref, orderId: id, amount: order.total };
    await expect(confirmProviderPayment(config("paytabs"), expected)).resolves.toBe("paid");
    await expect(
      confirmProviderPayment({ ...config("paytabs"), mode: "live" }, expected),
    ).rejects.toThrow("does not match");
    expect(fetch.mock.calls[1][0]).toBe("https://secure.paytabs.com/payment/query");
  });

  it("checks the PayTabs raw callback signature before accepting its notification", () => {
    const raw = JSON.stringify({ tran_ref: "TST123" });
    const signature = createHmac("sha256", config("paytabs").secret).update(raw).digest("hex");
    const request = new Request(order.webhookUrl, { headers: { signature } });
    expect(verifyProviderNotification(config("paytabs"), request, raw)).toBe(true);
    expect(verifyProviderNotification(config("paytabs"), request, "{}")).toBe(false);
  });

  it("inquires about the MyFatoorah invoice and verifies the successful transaction currency", async () => {
    const create = {
      IsSuccess: true,
      Data: { InvoiceId: 1234, InvoiceURL: "https://demo.myfatoorah.com/pay" },
    };
    const read = {
      IsSuccess: true,
      Data: {
        InvoiceId: 1234,
        CustomerReference: id,
        InvoiceValue: 120.5,
        InvoiceStatus: "Paid",
        InvoiceTransactions: [{ TransactionStatus: "Success", Currency: "AED" }],
      },
    };
    const fetch = responses(create, read, {
      ...read,
      Data: {
        ...read.Data,
        InvoiceTransactions: [{ TransactionStatus: "Success", Currency: "SAR" }],
      },
    });
    await expect(createProviderCheckout(config("myfatoorah"), order)).resolves.toMatchObject({
      reference: "1234",
    });
    const expected = { ...order, reference: "1234", orderId: id, amount: order.total };
    await expect(confirmProviderPayment(config("myfatoorah"), expected)).resolves.toBe("paid");
    await expect(confirmProviderPayment(config("myfatoorah"), expected)).rejects.toThrow(
      "currency",
    );
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ Key: "1234", KeyType: "InvoiceId" });
  });

  it("captures a PayPal order after checking approved USD amount and reference", async () => {
    const paypalOrder = { ...order, currency: "USD" as const };
    const token = { access_token: "fixture-oauth" };
    const paypalId = "7X71200000A1";
    const unit = { reference_id: id, amount: { currency_code: "USD", value: "120.50" } };
    const approved = {
      id: paypalId,
      intent: "CAPTURE",
      status: "APPROVED",
      purchase_units: [unit],
    };
    const captured = {
      ...approved,
      status: "COMPLETED",
      purchase_units: [
        { ...unit, payments: { captures: [{ status: "COMPLETED", amount: unit.amount }] } },
      ],
    };
    const fetch = responses(
      token,
      {
        id: paypalId,
        links: [{ rel: "payer-action", href: "https://www.sandbox.paypal.com/checkoutnow" }],
      },
      token,
      approved,
      {},
      captured,
    );
    await expect(createProviderCheckout(config("paypal"), paypalOrder)).resolves.toMatchObject({
      reference: paypalId,
    });
    await expect(
      confirmProviderPayment(config("paypal"), {
        ...paypalOrder,
        reference: paypalId,
        orderId: id,
        amount: order.total,
      }),
    ).resolves.toBe("paid");
    expect(fetch.mock.calls[4][1].headers["PayPal-Request-Id"]).toBe(id);
    expect(onlinePaymentMarket("AE", "AED", "paypal")).toBeNull();
    expect(onlinePaymentMarket("AE", "USD", "paypal")).toBe("AE");
  });

  it("refuses to issue a duplicate full refund after detecting an earlier Tabby refund", async () => {
    const snapshot = {
      id: reference,
      currency: "AED",
      amount: "120.50",
      status: "CLOSED",
      is_test: true,
      order: { reference_id: id },
      captures: [{ amount: "120.50" }],
      refunds: [{ amount: "20.00" }],
    };
    const fetch = responses(snapshot);
    await expect(
      requestProviderFullRefund(config("tabby"), {
        reference,
        orderId: id,
        currency: "AED",
        amount: 120.5,
      }),
    ).rejects.toThrow("has no refunds");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("uses a Checkout.com payment balance to confirm capture instead of a hosted page status", async () => {
    const settings = { ...config("checkoutcom"), hostPrefix: "fixture" };
    const hostedReference = "hpp_xGQBg0AXl3cM";
    const paymentId = `pay_${"b".repeat(26)}`;
    const merchantReference = BigInt(`0x${id.replaceAll("-", "")}`).toString(36);
    const page = {
      id: hostedReference,
      reference: merchantReference,
      amount: 12050,
      currency: "AED",
      status: "Payment Success",
    };
    const payment = {
      id: paymentId,
      reference: merchantReference,
      amount: 12050,
      currency: "AED",
      status: "Captured",
      metadata: { cyloo_order_id: id },
      balances: { total_captured: 12050, total_refunded: 0 },
    };
    responses(
      { ...page, _links: { redirect: { href: "https://pay.sandbox.checkout.com/page/test" } } },
      page,
      payment,
    );
    await expect(createProviderCheckout(settings, order)).resolves.toMatchObject({
      reference: hostedReference,
    });
    await expect(
      confirmProviderPayment(settings, {
        ...order,
        reference: hostedReference,
        orderId: id,
        amount: order.total,
      }),
    ).resolves.toBe("pending");
    await expect(
      checkoutComPaymentDetails(settings, { data: { payment_id: paymentId } }),
    ).resolves.toMatchObject({ orderId: id, state: "paid" });
  });

  it("requires a Telr paid order response in the correct mode", async () => {
    const session = { order: { ref: "telr-test-order", url: "https://secure.telr.com/pay" } };
    const snapshot = {
      order: {
        ref: "telr-test-order",
        cartid: id,
        test: 1,
        amount: "120.50",
        currency: "AED",
        status: { code: 3 },
      },
    };
    responses(session, snapshot, snapshot);
    await expect(createProviderCheckout(config("telr"), order)).resolves.toMatchObject({
      reference: "telr-test-order",
    });
    const expected = { ...order, reference: "telr-test-order", orderId: id, amount: order.total };
    await expect(confirmProviderPayment(config("telr"), expected)).resolves.toBe("paid");
    await expect(
      confirmProviderPayment({ ...config("telr"), mode: "live" }, expected),
    ).rejects.toThrow("does not match");
  });

  it("requires a signed Amazon Payment Services link status tied to the correct order", async () => {
    const settings = { ...config("amazonpayservices"), accessCode: "fixtureaccess" };
    const base = {
      merchant_identifier: "fixture-merchant",
      access_code: "fixtureaccess",
      merchant_reference: id,
      amount: 12050,
      currency: "AED",
      payment_link_id: "12345",
    };
    const signed = (fields: Record<string, string | number>) => {
      const text = Object.keys(fields)
        .sort()
        .map((key) => `${key}=${fields[key]}`)
        .join("");
      return {
        ...fields,
        signature: createHash("sha256")
          .update(`${settings.webhookSecret}${text}${settings.webhookSecret}`)
          .digest("hex"),
      };
    };
    const fetch = responses(
      signed({
        ...base,
        payment_link: "https://sbcheckout.payfort.com/test",
        response_code: "46000",
      }),
      signed({ ...base, payment_link_status: "Paid" }),
      { ...base, payment_link_status: "Paid", signature: "invalid" },
    );
    await expect(createProviderCheckout(settings, order)).resolves.toMatchObject({
      reference: "12345",
    });
    const request = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body)) as {
      amount: number;
      request_expiry_date: string;
    };
    expect(request.amount).toBe(12050);
    expect(request.request_expiry_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/);
    const expected = { ...order, reference: "12345", orderId: id, amount: order.total };
    await expect(confirmProviderPayment(settings, expected)).resolves.toBe("paid");
    await expect(confirmProviderPayment(settings, expected)).rejects.toThrow("invalid signature");
  });

  it("creates a Paddle subscription transaction on its approved checkout page", async () => {
    vi.stubEnv("PADDLE_API_KEY", "fixture-paddle-key");
    vi.stubEnv("PADDLE_CHECKOUT_URL", "https://billing.example.test/checkout");
    vi.stubEnv("PADDLE_ENV", "sandbox");
    const customerId = `ctm_${"c".repeat(26)}`;
    const transactionId = `txn_${"t".repeat(26)}`;
    const priceId = `pri_${"p".repeat(26)}`;
    const fetch = responses(
      { data: { id: customerId } },
      {
        data: {
          id: transactionId,
          checkout: { url: `https://billing.example.test/checkout?_ptxn=${transactionId}` },
        },
      },
    );
    const customer = await paddleProvider.createCustomer({
      organization_id: id,
      email: order.buyer.email,
    });
    const session = await paddleProvider.createCheckoutSession({
      organization_id: id,
      customer,
      plan_code: priceId,
      success_url: order.returnUrl,
      cancel_url: order.returnUrl,
    });
    expect(session.id).toBe(transactionId);
    expect(fetch.mock.calls[1][0]).toBe("https://sandbox-api.paddle.com/transactions");
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({
      customer_id: customerId,
      items: [{ price_id: priceId, quantity: 1 }],
      custom_data: { organization_id: id },
    });
  });
});
