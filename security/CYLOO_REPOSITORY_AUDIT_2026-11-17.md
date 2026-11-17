# Cyloo CRM repository audit

## Release and root causes

GitHub `main` and the live AWS release both reported `99a60525277a4cd3bddc1400ac17819f5aaf66b9`. This commit contains dashboard redesign `2c4091b`. The production health and database readiness endpoints passed. The authenticated dashboard and gateway catalog mismatch were both observed on that exact build. The deployed service worker is served with `no-cache, max-age=0, must-revalidate`.

The live Payment Gateways page reported three enabled entries. Production data identified Stripe in sandbox mode, Manual Invoicing, and Mollie in sandbox mode. Mollie's implementation is a placeholder. Several placeholder adapters advertised checkout and payments capabilities, which the display interpreted as a full adapter. Mercado Pago, Paystack, and Midtrans were still registered in the visible catalog even though a separate branch prepared to retire them.

The subscription billing admin page reads `payment_gateway_settings`. Tabby, Tamara, and the other customer checkout adapters read per-workspace and per-market server configuration. The admin page only displayed subscription billing settings, so it omitted the customer checkout providers entirely. Production had zero online checkout sessions or gateway delivery records at the time of the review. Deployed merchant configuration remains unverified.

## Local corrections

- Platform checkout, default selection, and workspace overrides reject placeholder adapters even when an old settings row says enabled. Stripe, Paddle, and offline invoicing retain their respective platform billing paths.
- The admin catalog omits Mercado Pago, Paystack, and Midtrans. Historical records and adapter identifiers are retained.
- The admin gateway manager reads customer checkout configuration from the server and displays the supported markets and configured modes without returning secret values or workspace identifiers. The view describes configuration separately from merchant connectivity tests.
- The authenticated shell defers the command palette until first use. The dashboard defers its layout editor until opened and shows a dialog skeleton while the module loads. Organization preparation uses a short-lived, user-scoped query to share recent results within a router session.

### Files changed

- `src/lib/billing/gateway-lifecycle.ts` added.
- `src/lib/billing/gateway-guard.server.ts`, `src/lib/billing/gateways.functions.ts`, `src/lib/billing/workspace-gateways.functions.ts`, `src/lib/billing/providers/index.ts`, and `src/lib/billing/providers/_stub.ts` updated.
- `src/lib/commerce/online-payments.server.ts`, `src/components/admin/billing/gateway-manager.tsx`, and `src/components/admin/billing/gateway-settings-panel.tsx` updated.
- `src/routes/_authenticated/route.tsx`, `src/routes/_authenticated/dashboard.tsx`, and `tests/unit/commerce-online-payments.test.ts` updated.
- The patch has zero file deletions and zero production data changes.

## Dashboard and performance evidence

Production rendered the dashboard and Customize Layout at 1440 px, 768 px, and 390 px with no horizontal document overflow. Contacts, Companies, Leads, Sales Pipeline, and Settings navigation rendered in the authenticated production session. A single cold production sign-in observation requested about 2.22 MB across 250 assets, with DOM content loaded after 12.1 seconds. Browser location, caches and connection conditions can affect that timing.

The table compares the preload lists emitted by the two local production builds under the same isolated database fixture. Bytes are the sum of individually gzipped preloaded JavaScript files. Repeat the browser timing measurements after deploying the candidate.

| Initial document | JavaScript preloads before | JavaScript preloads after | Gzip KiB before | Gzip KiB after |
| ---------------- | -------------------------: | ------------------------: | --------------: | -------------: |
| `/auth`          |                        128 |                       130 |             472 |            458 |
| `/dashboard`     |                        155 |                       152 |             553 |            550 |
| `/`              |                        168 |                       170 |             546 |            532 |

The candidate's authenticated browser test confirmed that the layout editor and command palette assets loaded on first use. The build already emits route chunks for areas such as Projects, Campaigns, Automations and Settings. Leads and Companies currently cap their initial fetch at 500 records. Broader bundle reduction, server pagination and production performance retesting remain open.

## Branch review and verification

- The AWS and platform-audit checkpoints, production-hardening branch and stage-one RLS branch are ancestors of `main`.
- `origin/feature/gcc-payment-gateway-catalog` has 13 commits outside `main`. Its catalog and retirement changes predate the production customer checkout adapters. The relevant retirement and activation behavior was adapted locally. The old catalog and seed migration remain on the feature branch.
- `feature/platform-vat-defaults` and its remote contain extensive older changes across unrelated areas. They were compared against `main` and left outside this payment and performance patch.
- Production and remote `main` still match `99a6052`. The new corrections are local.
- The candidate production build, scoped lint, and 225 unit and integration tests passed locally. An isolated browser rendered the gateway readiness view, blocked Mollie activation controls, and hid Paystack. A separate, signed-in fixture without a platform role was redirected to `/403`. The deployed baseline commit passed its GitHub CI and Docker verification. The candidate's repository-wide TypeScript check was still running at the end of the audit.

## Remaining validation

- Run authenticated staging checks for additional modules, lower-privilege account access and payment configuration changes before releasing the local patch.
- Configure eligible merchant sandbox accounts and verify Tabby and Tamara checkout, capture, notifications and full refunds end to end. The local fixture validates the readiness display without moving money.
- Generic CRM payment links still need a working payment implementation and independent validation.
- Measure the deployed candidate under repeatable desktop and mobile network conditions and profile large data tables before a broader performance pass.
