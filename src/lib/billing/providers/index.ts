/**
 * Billing provider registry.
 *
 * To add a new gateway:
 *   1. Implement `BillingProvider` in a new file under this directory.
 *   2. Register it in the `providers` map below.
 *   3. Ensure any required secrets are added via `add_secret`.
 *
 * Consumers call `getBillingProvider(id)` and interact only with the
 * `BillingProvider` interface — never with a specific gateway SDK.
 */

import {
  customProvider,
  flutterwaveProvider,
  lemonsqueezyProvider,
  mollieProvider,
  paypalProvider,
  razorpayProvider,
  myfatoorahProvider,
  paytabsProvider,
  tapProvider,
  tabbyProvider,
  tamaraProvider,
  hyperpayProvider,
  moyasarProvider,
  telrProvider,
  thawaniProvider,
  amazonPaymentServicesProvider,
} from "./future";
import { manualProvider } from "./manual";
import { paddleProvider } from "./paddle";
import { stripeProvider } from "./stripe";
import type { BillingProvider, BillingProviderId } from "./types";

/** Visible but not implemented. Never permit checkout or enablement for these ids. */
export const GCC_CATALOG_ONLY_IDS = [
  "myfatoorah", "paytabs", "tap", "tabby", "tamara",
  "hyperpay", "moyasar", "telr", "thawani", "amazon_payment_services",
] as const;

export const RETIRED_GATEWAY_IDS = ["mercadopago", "paystack", "midtrans"] as const;

export function isCatalogOnlyGateway(id: string): boolean {
  return (GCC_CATALOG_ONLY_IDS as readonly string[]).includes(id);
}

export function isRetiredGateway(id: string): boolean {
  return (RETIRED_GATEWAY_IDS as readonly string[]).includes(id);
}

const providers: Record<string, BillingProvider> = {
  stripe: stripeProvider,
  paddle: paddleProvider,
  manual: manualProvider,
  paypal: paypalProvider,
  lemonsqueezy: lemonsqueezyProvider,
  razorpay: razorpayProvider,
  flutterwave: flutterwaveProvider,
  mollie: mollieProvider,
  myfatoorah: myfatoorahProvider,
  paytabs: paytabsProvider,
  tap: tapProvider,
  tabby: tabbyProvider,
  tamara: tamaraProvider,
  hyperpay: hyperpayProvider,
  moyasar: moyasarProvider,
  telr: telrProvider,
  thawani: thawaniProvider,
  amazon_payment_services: amazonPaymentServicesProvider,
  custom: customProvider,
};

export function getBillingProvider(id: BillingProviderId): BillingProvider {
  const provider = providers[id];
  if (!provider) {
    throw new Error(
      `Unknown billing provider: ${id}. Registered: ${Object.keys(providers).join(", ")}`,
    );
  }
  return provider;
}

export function listBillingProviders(): Array<
  Pick<BillingProvider, "id" | "displayName" | "supports">
> {
  return Object.values(providers).map((p) => ({
    id: p.id,
    displayName: p.displayName,
    supports: p.supports,
  }));
}

export function getDefaultBillingProvider(): BillingProvider {
  return stripeProvider;
}

export type { BillingProvider, BillingProviderId } from "./types";
export * from "./types";
