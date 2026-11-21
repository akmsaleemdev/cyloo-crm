import { useState } from "react";
import { CreditCard } from "lucide-react";

/**
 * Gateway identity mark. Domain list is fixed in source, never supplied by users.
 * Favicons are visual placeholders until approved first-party logo assets are bundled.
 * Failed or blocked requests fall back to an accessible initial mark.
 */
const PROVIDER_DOMAINS: Record<string, string> = {
  stripe: "stripe.com",
  paddle: "paddle.com",
  paypal: "paypal.com",
  lemonsqueezy: "lemonsqueezy.com",
  razorpay: "razorpay.com",
  flutterwave: "flutterwave.com",
  mollie: "mollie.com",
  myfatoorah: "myfatoorah.com",
  paytabs: "paytabs.com",
  tap: "tap.company",
  tabby: "tabby.ai",
  tamara: "tamara.co",
  hyperpay: "hyperpay.com",
  moyasar: "moyasar.com",
  telr: "telr.com",
  thawani: "thawani.om",
  amazon_payment_services: "paymentservices.amazon.com",
};

export function GatewayLogo({
  providerId,
  name,
  className = "",
}: {
  providerId: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const domain = PROVIDER_DOMAINS[providerId];
  return (
    <span
      role="img"
      aria-label={`${name} logo`}
      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card text-foreground ${className}`}
    >
      {domain && !failed ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-7 w-7 object-contain"
          onError={() => setFailed(true)}
        />
      ) : providerId === "manual" || providerId === "custom" ? (
        <CreditCard aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
      ) : (
        <span aria-hidden="true" className="text-xs font-bold tracking-tight">
          {name.trim().slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}
