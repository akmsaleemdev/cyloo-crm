# CYLOO CRM

CYLOO is a multi-tenant customer messaging and CRM application built with React, TanStack Start, Vite and Nitro. Supabase provides Auth, PostgreSQL, Storage and Realtime. The web application runs as a standalone Node server on AWS; native mobile and the stateful WhatsApp QR worker are separate applications.

**Release status:** local build/test results are recorded in the cleanup report. Deployment configuration is provided, but AWS deployment, live tenant isolation and complete production readiness require the outstanding checks in [deployment](docs/DEPLOYMENT.md). Do not treat older audit reports as current test evidence.

## Requirements and repository layout

- Node 22.12 or newer in the Node 22 release line; npm 11.9 was used for verification.
- A separate Supabase project for local/staging work. Never point destructive fixture or migration commands at production without review and backups.
- Docker for container verification/deployment. AWS CLI and a short-lived AWS role are needed for deployment.
- Bun 1.4.4 is supported with the checked-in public-registry lockfiles. CI and Docker use the npm lockfile; update and verify both root locks when changing dependencies.

| Path                                           | Responsibility                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `src/routes/`                                  | File-based pages, authenticated application routes and HTTP APIs          |
| `src/components/`, `src/hooks/`, `src/shared/` | UI, browser state and shared components                                   |
| `src/lib/`                                     | CRM, billing, messaging, integrations, authorization and server functions |
| `src/integrations/supabase/`                   | Supabase clients, bearer middleware and generated schema types            |
| `supabase/migrations/`                         | Ordered database history; never delete applied migrations                 |
| `public/`                                      | Stable public assets and service worker                                   |
| `tests/`                                       | Unit/source-security, integration, browser and isolated live RLS tests    |
| `deploy/`                                      | AWS task example and optional EC2 reverse-proxy configuration             |
| `mobile/`                                      | Independent Expo/React Native application and lockfile                    |
| `qr-worker/`                                   | Independent, stateful WhatsApp socket service                             |
| `docs/`                                        | Customer documentation portal, deployment and maintenance evidence        |

## Local setup

```sh
npm ci
cp .env.example .env
# Fill the required public/server Supabase variables and APP_ORIGIN.
npm run dev -- --host 127.0.0.1 --port 8080 --strictPort
```

Use `APP_MODE=production` and `VITE_APP_MODE=production` for an editable isolated test installation. `demo` mode intentionally blocks many mutations; do not disable its write guards to make a test pass. Vite loads development environment files; Node startup can load an ignored `.env` locally. AWS injects server variables from Secrets Manager and contains no `.env` file in the image.

The public Supabase URL/key must be set **before building** because `VITE_*` values are compiled into browser assets. Changing runtime variables does not change that browser bundle.

## Environment variables

The complete commented template is [.env.example](.env.example). Keep all real `.env` variants out of Git, Docker build contexts, logs and test artifacts.

| Variable                                             | Where                          | Purpose                                                                                                      |
| ---------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Build/public                   | Browser Supabase endpoint and publishable/legacy anon key; never a server key                                |
| `VITE_APP_MODE`, `APP_MODE`                          | Build / server                 | `production` or intentionally read-only `demo`                                                               |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`           | Server                         | Authenticated, RLS-scoped server requests                                                                    |
| `SUPABASE_SERVICE_ROLE_KEY`                          | Server secret                  | Privileged background/admin operations; bypasses RLS, never public                                           |
| `APP_ORIGIN`                                         | Server                         | Canonical HTTPS origin for OAuth, widgets and callbacks                                                      |
| `APP_USER_CONNECTION_KEY_SECRET`                     | Server secret                  | Stable 32-byte base64 key for stored integration credentials                                                 |
| `INTERNAL_CRON_TOKEN`                                | Server secret + Supabase Vault | Authentication for scheduled endpoints; also configure `cyloo_cron_base_url` and `cyloo_cron_token` in Vault |
| `WIDGET_SIGNING_SECRET`, `WEBHOOK_DISPATCH_SECRET`   | Server secrets                 | Widget sessions and outgoing webhook signatures                                                              |
| `SETUP_BOOTSTRAP_TOKEN`                              | Temporary server secret        | First administrator bootstrap; remove after installation                                                     |
| `HOST`, `PORT`                                       | Server                         | Container defaults: `0.0.0.0`, `3000`                                                                        |
| Provider/OAuth/billing/worker variables              | Server secrets                 | Configure only enabled integrations, using the template and each provider's callback/webhook requirements    |

The production prebuild checks reject privileged keys in public variables, including values loaded from production dotenv files. Server startup also rejects missing core configuration and unsafe origins. Encryption keys must survive redeployment and rollback; rotating one without a re-encryption procedure can make stored credentials unreadable. Do not put server secrets in `VITE_*`, `EXPO_PUBLIC_*`, GitHub variables or image build arguments.

## Supabase setup and maintenance

Link the **isolated** project using the Supabase CLI, inspect migration history and review a dry run before applying changes:

```sh
supabase link --project-ref YOUR_STAGING_PROJECT_REF
supabase migration list --linked
supabase db push --linked --dry-run
# Apply only after reviewing the dry run and taking an appropriate backup.
```

The repository contains historical migrations, including earlier provider values and cron destinations. Do not rewrite migration history or assume that a static source check proves the current database policy state. Verify effective RLS, table/column grants, RPC privileges, storage bucket policies and realtime publication access in staging. Configure Supabase Auth Site URL and allowed callback URLs for the deployed domain, SMTP as required, and the Vault values used by cron. Keep service-role operations behind server-side authorization.

## Build, run and verify

```sh
npm run typecheck
npm run lint
npm test -- --maxWorkers=2
npm run security:policies
npm run security:scan
npm audit --audit-level=high
npm run build
npm start
```

The default build uses Nitro's `node-server` preset and writes `.output/`. `npm start` runs the validated Node entry. `/api/public/health` is a lightweight liveness endpoint, not proof of database connectivity or tenant security. `npm run build:cloudflare` and the existing Netlify configuration remain optional compatibility targets; they are not used by AWS CI deployment.

`npm run test:smoke` requires Playwright Chromium (`npx playwright install chromium`). An installed Chrome can be used with `PLAYWRIGHT_CHANNEL=chrome`; set `PLAYWRIGHT_VIDEO=off` if optional video capture is unavailable. Set `E2E_BASE_URL` only when an appropriate server is already running; otherwise Playwright starts local Vite on port 8080. Browser specs currently cover smoke and selected headers, not every CRM or billing workflow.

`npm run test:rls` performs read-only cross-tenant contact-fixture checks. Supply an approved isolated project's `SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY`, `RLS_TEST_ENVIRONMENT=isolated`, and `RLS_TENANT_{A,B}_{TOKEN,WORKSPACE_ID,CONTACT_ID}`. Fixtures must belong to different tenants. Missing configuration fails the suite; it is not silently counted as a passing isolation test. These checks do not replace write-policy/storage/realtime testing. Never enable the mutating public RLS setup harness in production.

`npm run audit:unused` lists candidates for review. Framework entries, public assets and maintenance tools must be checked before deleting anything. `npm run format` formats maintained files; generated routes, schema history, dependencies and build output are excluded appropriately.

## AWS deployment

Follow [the deployment and rollback guide](docs/DEPLOYMENT.md). The repository provides a non-root Node container, an ECS task-definition example, and an explicit GitHub Actions ECS deployment workflow. Provision the VPC/subnets, TLS load balancer, ECR repository, ECS service, logs and least-privilege roles in your AWS account first. No AWS infrastructure is created merely by pushing source.

The deployment workflow uses GitHub OIDC, requires successful CI for the exact commit, tags the image by commit SHA, preserves the existing ECS runtime configuration/secret references, and waits for service stability. Configure protected GitHub `staging` and `production` environments. Verify staging before authorizing production.

## Companion applications

See [mobile/README.md](mobile/README.md) and [qr-worker/README.md](qr-worker/README.md). Install and check them independently. The QR worker persists WhatsApp credentials and must not be scaled like the stateless web service or stored on an ephemeral Fargate root filesystem.

## Maintenance and release evidence

The latest [cleanup and verification report](docs/audit/CYLOO_AWS_SUPABASE_CLEANUP.md) records passing checks and unresolved release blockers. This repository is not currently signed off for production.

Keep applied migrations, generated Supabase types, provider adapters, security checks, licenses and public documentation assets. Validate dependency/lockfile changes with real frozen installs. Record exact failures and blocked checks rather than updating a security baseline to hide them. Commit only reviewed source; never include local credentials, database exports, runtime session directories or generated test/build output.
