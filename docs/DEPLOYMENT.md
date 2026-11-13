# CYLOO deployment and rollback

Current guidance for the repository as of 2026-11-13. See the [platform audit](./audit/CYLOO_PLATFORM_INDEPENDENCE.md) for validation results and release blockers. Older documentation sections and changelogs describe historical implementations; they are not release approval.

For the complete EC2 walkthrough using the production Dockerfile and automatic
HTTPS, start with [AWS Docker deployment](./AWS_DOCKER_DEPLOYMENT.md).

## Reproducible installation

Use Node 22.12+ and npm 11.9, or Bun 1.4.4. Both applications' Bun lockfiles use the public npm registry. Keep the root npm lockfile synchronized: GitHub Actions and Docker use frozen npm installation. Do not replace integrity hashes or tarball URLs manually.

```sh
npm ci
npm run typecheck
npm run lint
npm test -- --maxWorkers=2
npm run security:scan
npm run security:policies
```

`security:scan` is the static CI gate. Run `npm run security:extensions` separately
against the intended database with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
provided securely; it is a required deployment check, not a secret-free CI task.

The Expo application is independent: install from `mobile/` with its own lockfile and run its typecheck and native release checks separately. The QR worker requires Node >=20 and has no committed lockfile; repeatable worker installation remains a release task.

## Choose a deployment target

The default `npm run build` produces a standalone Node server for AWS. Explicit Nitro presets remain available for supported alternate hosts. Build and start with:

```sh
npm run build
npm start
```

Docker uses `build:server` with the Node preset and runs the validated startup script as a non-root user. Cloudflare is opt-in via `npm run build:cloudflare`; never deploy the Node artifact as a Worker. Netlify remains a compatibility target and is not the AWS deployment path.

For Cloudflare, use `npm run deploy:cloudflare -- --name WORKER --domain HOSTNAME`.
Its predeploy hook rebuilds the current source with the Cloudflare preset and runs
the normal prebuild checks and postbuild SSR/documentation steps. A failed build
stops deployment rather than uploading an older `.output/` artifact. Use
`npm run deploy:cloudflare -- --dry-run` to build and validate without publishing.
Worker and domain settings can also be supplied through the existing Cloudflare
environment variables. A Git push alone does not publish a Cloudflare Worker or
dispatch the manual AWS workflow.

For an existing Docker installation, a Git pull alone does not replace running
containers. Rebuild and recreate the application from its deployed checkout:

```sh
docker compose --env-file .env.production build --build-arg APP_COMMIT="$(git rev-parse HEAD)" app
docker compose --env-file .env.production up -d --no-deps --force-recreate app
docker compose --env-file .env.production exec -T proxy nginx -t
docker compose --env-file .env.production exec -T proxy nginx -s reload
```

The `/api/public/health` response includes the artifact's `commit` and `built_at`.
Compare these after deployment; local builds with uncommitted changes include a
`-dirty` suffix. Immutable asset URLs may be cached, but the service worker script
must be revalidated so installed clients receive updates. Use the actual host's
deployment mechanism; the example Cloudflare domain is not a production target.
After publishing a clean commit, verify the actual host with:

```sh
npm run verify:deployment -- https://YOUR_HOST --commit EXPECTED_COMMIT_SHA
```

The check fails if a healthy server still serves an older commit or if its
service worker is cached without revalidation. Reloading nginx also refreshes
the Docker application's upstream address after container replacement.

Configure the variables documented in `.env.example` using your hosting provider's secret store. Set the actual Supabase URL and public key at build time. Keep service-role keys, cron tokens, provider credentials and encryption keys server-only. Direct Google/Microsoft OAuth integrations require registered callback URLs on the deployed host and a stable `APP_USER_CONNECTION_KEY_SECRET`. AI calls use configured direct providers; no builder gateway credentials are required.

## Staging validation required

1. Use an isolated Supabase project, synthetic accounts in two tenants, sandbox billing and messaging providers, and a nonproduction host. Do not use production customer records.
2. Inspect applied migration history, effective RLS policies, grants, storage policies and existing `cron.job` destinations. Historical migrations contain retired hosts; prove the effective jobs use the deployed host before release. This cleanup does not apply migrations or rewrite jobs.
3. Verify sign-in/out, signup/onboarding, reset/OAuth callbacks, CRM create/read/update/delete, deal moves, dashboards, subscriptions, messaging and AI provider calls. Attempt each tenant operation with the other tenant's session and through storage/realtime/RPC APIs.
4. Run `npm run test:smoke` with an approved `E2E_BASE_URL`. Run manual keyboard/mobile/reduced-motion checks and inspect browser console/network requests. The checked-in browser tests do not cover all business workflows.
5. Keep the mutating RLS setup harness disabled outside isolated testing; do not enable its production override. Use `npm run test:rls` with explicitly configured synthetic tenant fixtures for read-only checks. Read-isolation tests do not verify write/storage/realtime policies or every application API.
6. Require all release gates to pass. A successful build or static policy test is insufficient to approve production.

## Rollback

The pre-cleanup Git checkpoint is `checkpoint/platform-audit-20261113` at `133c779`. The pre-existing local installation-page edit was separately saved in `coverage/platform-audit/pre-existing.patch`; preserve it when reviewing or reverting this change.

For a deployed release, retain the previously tested immutable artifact and its environment-variable names, then redeploy it through the same hosting service. Confirm health, sign-in and provider callbacks after rollback. Do not run a destructive database reset or reverse historical migrations. No database migration or production data change is part of this cleanup, so this change needs no schema rollback. Preserve encryption keys and existing integration records across both releases.

## AWS ECS Fargate configuration

The AWS account, region, network and existing service must be supplied by the operator. The repository does not provision them automatically. `deploy/aws/task-definition.example.json` is an example with placeholders, not a deployed task definition.

1. Create an ECR repository with immutable image tags and image scanning, a CloudWatch log group, and an ECS cluster/service. Put tasks in private subnets with outbound HTTPS connectivity to Supabase and enabled providers. Use at least two availability zones for a production service.
2. Terminate HTTPS at an Application Load Balancer using a validated ACM certificate and the intended custom hostname. Allow task port 3000 only from the ALB security group. Configure HTTP-to-HTTPS redirection, health checks, graceful connection draining and the ECS deployment circuit breaker with rollback. Register the same canonical host in `APP_ORIGIN` and Supabase/OAuth allowed redirects.
3. Build with the **public** Supabase URL/key for the target environment. Set server configuration in the task definition; inject secrets using Secrets Manager references. Never pass a service-role key as a Docker build argument. The example injects selected keys from a JSON secret; each referenced key must exist. Add enabled provider credentials as additional secret references.
4. Give the task execution role only the required ECR pull, log-writing and Secrets Manager/KMS permissions. The application task role needs no broad AWS permissions just to call Supabase. Do not add S3/RDS permissions unless an implemented integration actually requires them; Supabase is not interchangeable with a bare RDS database.
5. Create GitHub `staging` and `production` environments with review protection. Configure environment variables `AWS_REGION`, `AWS_ROLE_ARN`, `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY`. The referenced existing ECS container must be named `cyloo`.
6. Configure GitHub's OIDC provider and restrict the deployment role's trust subject to this repository and the selected protected environment. Use short-lived role credentials; do not store long-lived AWS access keys in GitHub or source. Limit deployment permissions to the intended ECR repository/ECS service and required role passing.
7. Run CI for the exact commit, then explicitly dispatch **Deploy CYLOO to AWS ECS** against staging. It refuses to deploy without successful CI, builds a commit-tagged image, preserves existing runtime/secret configuration, and waits for stability. Run the business, browser and isolation checks before dispatching production.
8. Retain the prior ECS task-definition revision and image digest for rollback. Redeploy that tested revision if verification fails. Enable backups/point-in-time recovery and rehearse database recovery independently of application rollback.

References: [ECS task-definition parameters](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html), [Fargate networking](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-networking.html), [deployment circuit breaker](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html), and [Supabase production checklist](https://supabase.com/docs/guides/security/production-checklist).

The WhatsApp QR worker needs durable credential storage and a single session owner; deploy it separately from the stateless web replicas. The read-only root filesystem in the task example must be validated against every enabled integration before use; add narrowly scoped writable ephemeral mounts if a verified integration needs temporary files.
