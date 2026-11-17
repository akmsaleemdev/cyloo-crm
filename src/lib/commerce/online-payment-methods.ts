export const ONLINE_PAYMENT_PROVIDERS = [
  "tabby",
  "tamara",
  "tap",
  "paytabs",
  "myfatoorah",
  "paypal",
  "checkoutcom",
  "telr",
  "amazonpayservices",
] as const;

export type OnlinePaymentProvider = (typeof ONLINE_PAYMENT_PROVIDERS)[number];

export const ONLINE_PAYMENT_LABELS: Record<OnlinePaymentProvider, string> = {
  tabby: "Tabby",
  tamara: "Tamara",
  tap: "Tap Payments",
  paytabs: "PayTabs",
  myfatoorah: "MyFatoorah",
  paypal: "PayPal",
  checkoutcom: "Checkout.com",
  telr: "Telr",
  amazonpayservices: "Amazon Payment Services",
};

export function isOnlinePaymentProvider(value: unknown): value is OnlinePaymentProvider {
  return ONLINE_PAYMENT_PROVIDERS.some((provider) => provider === value);
}

export const GCC_MARKETS = ["AE", "SA", "QA", "BH", "KW", "OM"] as const;
export type PaymentMarket = (typeof GCC_MARKETS)[number];

export function isGccMarket(country: string): country is PaymentMarket {
  return GCC_MARKETS.some((market) => market === country);
}

export function onlinePaymentMarket(
  country: string,
  currency: string,
  provider?: OnlinePaymentProvider,
): PaymentMarket | null {
  const market = country.trim().toUpperCase();
  const code = currency.trim().toUpperCase();
  if (provider === "paypal") return code === "USD" && isGccMarket(market) ? market : null;
  if (market === "AE" && code === "AED") return market;
  if (market === "SA" && code === "SAR") return market;
  if (
    market === "QA" &&
    code === "QAR" &&
    ["tap", "paytabs", "myfatoorah", "checkoutcom", "amazonpayservices"].includes(provider ?? "")
  )
    return market;
  return null;
}
