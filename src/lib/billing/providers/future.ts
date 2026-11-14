/**
 * Future gateway adapters — declared here so the abstraction layer, admin UI,
 * and registry treat them as first-class from day one. Each stub throws
 * `BillingProviderUnsupported` until its real implementation lands.
 *
 * Adding a new provider is a two-step swap:
 *   1. Implement the `BillingProvider` interface in a dedicated file.
 *   2. Export it here (or from providers/index.ts) in place of the stub.
 */

import { createStubProvider } from "./_stub";

/** PayPal — cards + PayPal wallet + Pay Later. */
export const paypalProvider = createStubProvider({
  id: "paypal",
  displayName: "PayPal",
  supports: {
    checkout: true,
    customer_portal: false,
    payments: true,
    refunds: true,
    partial_refunds: true,
    webhooks: true,
  },
});

/** Lemon Squeezy — merchant-of-record for digital goods. */
export const lemonsqueezyProvider = createStubProvider({
  id: "lemonsqueezy",
  displayName: "Lemon Squeezy",
  supports: {
    checkout: true,
    customer_portal: true,
    tax: true,
    coupons: true,
    payments: true,
    refunds: true,
    webhooks: true,
  },
});

/** Razorpay — India, UPI + cards. */
export const razorpayProvider = createStubProvider({
  id: "razorpay",
  displayName: "Razorpay",
  supports: {
    checkout: true,
    payments: true,
    refunds: true,
    partial_refunds: true,
    webhooks: true,
  },
});

/** Flutterwave — Africa + global payouts. */
export const flutterwaveProvider = createStubProvider({
  id: "flutterwave",
  displayName: "Flutterwave",
  supports: {
    checkout: true,
    payments: true,
    refunds: true,
    partial_refunds: true,
    webhooks: true,
  },
});

/** Mollie — European cards + local payment methods (iDEAL, Bancontact, SEPA). */
export const mollieProvider = createStubProvider({
  id: "mollie",
  displayName: "Mollie",
  supports: {
    checkout: true,
    customer_portal: true,
    payments: true,
    refunds: true,
    partial_refunds: true,
    webhooks: true,
  },
});

/** Custom Gateway — customer-supplied endpoint + HMAC webhook. */
export const customProvider = createStubProvider({
  id: "custom",
  displayName: "Custom Gateway",
  supports: {
    checkout: true,
    payments: true,
    refunds: true,
    partial_refunds: true,
    webhooks: true,
  },
});

/** GCC payment gateways: catalog-only until each provider's verified API adapter is implemented.
 * All capabilities remain disabled so the UI cannot present a stub as a real gateway.
 * Tabby and Tamara are mandatory roadmap integrations, NOT live BNPL checkouts.
 */
export const myfatoorahProvider = createStubProvider({
  id: "myfatoorah",
  displayName: "MyFatoorah",
});

export const paytabsProvider = createStubProvider({
  id: "paytabs",
  displayName: "PayTabs",
});

export const tapProvider = createStubProvider({
  id: "tap",
  displayName: "Tap Payments",
});

export const tabbyProvider = createStubProvider({
  id: "tabby",
  displayName: "Tabby",
});

export const tamaraProvider = createStubProvider({
  id: "tamara",
  displayName: "Tamara",
});

export const hyperpayProvider = createStubProvider({
  id: "hyperpay",
  displayName: "HyperPay",
});

export const moyasarProvider = createStubProvider({
  id: "moyasar",
  displayName: "Moyasar",
});

export const telrProvider = createStubProvider({
  id: "telr",
  displayName: "Telr",
});

export const thawaniProvider = createStubProvider({
  id: "thawani",
  displayName: "Thawani",
});

export const amazonPaymentServicesProvider = createStubProvider({
  id: "amazon_payment_services",
  displayName: "Amazon Payment Services",
});
