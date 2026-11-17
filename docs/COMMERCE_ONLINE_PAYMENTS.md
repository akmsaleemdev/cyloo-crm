# Commerce online payments

Client checkout supports merchant-hosted checkout for Tabby, Tamara, Tap Payments, PayTabs, MyFatoorah, PayPal, Checkout.com, Telr and Amazon Payment Services. This flow applies to customer orders. Generic CRM payment links use a separate flow.

## Merchant configuration

Apply `20261117014033_commerce_online_payment_sessions.sql` with the normal migration workflow. Set `APP_ORIGIN` to the HTTPS address where the client portal is served. Store merchant credentials as server runtime secrets using this prefix for each workspace, market, and provider:

```text
COMMERCE_<WORKSPACE_UUID_WITHOUT_HYPHENS_IN_UPPERCASE>_<GCC_COUNTRY_CODE>_<PROVIDER>
```

| Provider suffix     | Settings after the prefix                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TABBY`             | `_API_KEY`, `_MERCHANT_CODE`, `_WEBHOOK_SECRET`. Set `_AUTO_CAPTURE=true` only for a merchant configured for immediate capture.                                               |
| `TAMARA`            | `_API_KEY`, `_WEBHOOK_SECRET` (Tamara notification token). Confirm capture settings and fulfillment requirements with the merchant.                                           |
| `TAP`               | `_API_KEY`, `_MERCHANT_CODE` (Tap merchant ID). Tap signs notifications using the API key.                                                                                    |
| `PAYTABS`           | `_API_KEY` (profile server key), `_MERCHANT_CODE` (numeric profile ID). PayTabs signs callbacks using the API key.                                                            |
| `MYFATOORAH`        | `_API_KEY`, `_WEBHOOK_SECRET` (MyFatoorah webhook secret). Enable V2 payment-status notifications.                                                                            |
| `PAYPAL`            | `_API_KEY` (client secret), `_MERCHANT_CODE` (client ID), `_WEBHOOK_SECRET` (registered webhook ID).                                                                          |
| `CHECKOUTCOM`       | `_API_KEY`, `_MERCHANT_CODE` (processing channel ID), `_HOST_PREFIX` (account API hostname prefix), `_WEBHOOK_SECRET`. Enable Hosted Payments Page on the merchant account.   |
| `TELR`              | `_API_KEY` (authentication key), `_MERCHANT_CODE` (store ID), `_WEBHOOK_SECRET` (transaction advice signing key).                                                             |
| `AMAZONPAYSERVICES` | `_API_KEY` (SHA Request Phrase), `_WEBHOOK_SECRET` (SHA Response Phrase), `_MERCHANT_CODE` (merchant identifier), `_ACCESS_CODE`. Configure SHA-256 and enable Payment Links. |

The `_MODE` setting defaults to `sandbox`. Set `live` only with the corresponding live merchant credentials after a sandbox checkout passes. Sandbox sessions update their test status and leave the commerce order unpaid.

The regional adapters support UAE/AED and Saudi Arabia/SAR. Tap, PayTabs, MyFatoorah, Checkout.com and Amazon Payment Services also support Qatar/QAR with an eligible merchant account. PayPal requires a USD-denominated order and can be configured in any of the six GCC markets. Checkout uses the existing order total and currency. Bahrain, Kuwait and Oman require a cart and order precision update before three-decimal local currencies can be offered. The payment choice appears only when the workspace and market credentials are present.

## Webhooks and capture

Use the following notification endpoint for each merchant account. The `account` query value is the original workspace UUID with hyphens.

```text
https://<APP_ORIGIN_HOST>/api/public/webhooks/billing/<provider>?account=<workspace_uuid>&market=<country_code>
```

- **Tabby** — Register the custom notification header `X-Cyloo-Webhook-Token` with the configured webhook secret. If automatic capture is off, capture on the merchant side and let Cyloo reconcile the resulting notification.
- **Tamara** — Register approved, authorized, captured, canceled, expired and refunded events as applicable. Cyloo authorizes approved orders. It records payment when Tamara confirms full capture. Use the merchant's approved auto-capture or fulfillment workflow.
- **Tap and PayTabs** — The checkout request includes the notification URL. The endpoint verifies the provider signature and fetches the transaction before confirming payment.
- **MyFatoorah** — Enable V2 payment-status notifications and its webhook signature. The invoice must settle in the expected order currency.
- **PayPal** — Register the order-approved and capture events and use the returned webhook ID in the server configuration. Cyloo captures an approved order after checking the order reference and amount.
- **Checkout.com** — Register payment-approved, captured, declined, voided and refunded events for the processing channel. Capture and refund reconciliation uses the underlying payment balances from Checkout.com.
- **Telr** — Register signed transaction advice for the store. Cyloo checks both the order reference and the gateway's capture status.
- **Amazon Payment Services** — Configure signed transaction notifications for the merchant. Cyloo checks the signed Payment Link status against the order and merchant.

Workspace owners and admins can request one full Tabby or Tamara refund per captured order from the CRM order page. Cyloo records a refund when the provider confirms it. If the request outcome is uncertain, reconcile it in the merchant dashboard before attempting another refund. Other gateway refunds are handled in the merchant dashboard.

## Sandbox verification

For each configured merchant account and market, place a real sandbox order through the client portal. Check the provider amount and currency, successful capture, declined or canceled checkout, and webhook reconciliation with the browser closed. Replay a provider delivery from its sandbox dashboard and confirm the order status does not change twice. For Tabby and Tamara, verify a full refund and check the provider dashboard and CRM order status. Confirm the sandbox order stays unpaid in the commerce ledger.

## Paddle subscription billing

Paddle uses Cyloo's subscription plan mapping. Configure `PADDLE_API_KEY`, `PADDLE_ENV`, `PADDLE_WEBHOOK_SECRET`, and `PADDLE_CHECKOUT_URL`. The checkout URL must point to the approved merchant page that loads Paddle.js and opens the transaction passed in `_ptxn`. Link the Cyloo plan to the corresponding Paddle price and register the existing Paddle billing webhook route. Test subscription checkout, webhook reconciliation, the customer portal and cancellation with the sandbox account before enabling live plans.
