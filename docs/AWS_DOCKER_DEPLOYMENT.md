# Deploy CYLOO on AWS with Docker

This guide installs one EC2 instance with the production Node image and Caddy for
automatic HTTPS at `https://crm.rashfolio.com`. It does not create a new database:
keep the existing Supabase project, application secrets, and encryption keys.
The EC2 instance is a single server; updates can briefly interrupt requests. Use
the [ECS deployment path](./DEPLOYMENT.md#aws-ecs-fargate-configuration) if your
existing infrastructure uses Fargate or needs multiple web replicas.

The AWS region, instance ID, SSH user/host, and exact old application directory
are not yet supplied. No AWS resources or old server files have been removed by
preparing this repository. Replace the placeholders below with your real values.

## 1. Create or identify the EC2 server

1. In your chosen AWS region, use an Ubuntu 24.04 LTS **x86_64 or ARM64** instance with
   at least 2 vCPUs, preferably 8 GiB RAM for builds, and 30 GiB encrypted EBS storage. Monitor
   memory/disk and resize for your workload. This is starting capacity, not a load
   certification. Keep the existing instance if it already meets the requirements.
   Build natively on the instance architecture; do not load an amd64-only image
   onto an ARM64 server. CI verifies both architectures. EC2 Compose limits the
   Node build heap to 2 GiB (`BUILD_NODE_MAX_OLD_SPACE_SIZE=2048`); smaller existing
   instances also need enough available RAM/swap and disk for the running app and
   temporary build layers. A low-memory failure should be resolved before cutover.
2. Use an EC2 key pair or Systems Manager Session Manager. For SSH, permit TCP 22
   only from your administrator IP. Permit inbound TCP 80 and 443 for the web
   site. Do not expose application port 3000 to the internet.
3. Attach an Elastic IP, or retain the existing stable IP. Set the DNS A record
   for `crm.rashfolio.com` to it. Remove or correct an AAAA record if IPv6 does not
   reach this server. On a new instance, switch DNS only when ready for cutover.
4. Keep existing storage, snapshots, TLS assets, cron settings, and database
   configuration until the replacement is verified. Record the old instance ID,
   container/service names, source directory, and running image before cutover.

Connect from your own computer (replace both placeholders):

```sh
ssh -i /path/to/your-existing-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

## 2. Install Docker on Ubuntu

If Docker Engine and the Compose plugin already work, skip installation. These
commands target a fresh Ubuntu server, using Docker's official package repository.
See [Docker's Ubuntu installation instructions](https://docs.docker.com/engine/install/ubuntu/)
for supported versions and handling a server with conflicting existing packages.

```sh
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
printf 'Types: deb\nURIs: https://download.docker.com/linux/ubuntu\nSuites: %s\nComponents: stable\nSigned-By: /etc/apt/keyrings/docker.asc\n' "$VERSION_CODENAME" | sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker version
sudo docker compose version
```

Do not reinstall Docker on a running production host without first inspecting
its existing containers and package installation.

## 3. Download a fresh source release

Use this new directory so the old installation remains available for rollback.
If `/opt/cyloo/app` already exists, use the update procedure in section 9 instead.

```sh
sudo install -d -m 0755 -o "$(id -u)" -g "$(id -g)" /opt/cyloo
git clone https://github.com/akmsaleemdev/cyloo-crm.git /opt/cyloo/app
cd /opt/cyloo/app
git fetch origin main
export APP_COMMIT=$(git rev-parse origin/main)
git checkout --detach "$APP_COMMIT"
git status --short
```

For an approved immutable release, set `APP_COMMIT` to the full published SHA
provided with the release instead of resolving `origin/main`. The working tree
must have no tracked changes before building. Ignored environment files are expected.

## 4. Configure production environment values

```sh
cd /opt/cyloo/app
umask 077
cp .env.example .env.production
chmod 600 .env.production
nano .env.production
```

Set these values in the editor; angle-bracket placeholders are not valid credentials:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<existing public publishable or anon key>
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=<same public key>
SUPABASE_SERVICE_ROLE_KEY=<existing server-only key>
APP_ORIGIN=https://crm.rashfolio.com
APP_DOMAIN=crm.rashfolio.com
ACME_EMAIL=<your certificate contact email>
APP_MODE=production
VITE_APP_MODE=production
VITE_APP_ENV=production
APP_MEMORY_LIMIT=2g
APP_USER_CONNECTION_KEY_SECRET=<preserve the existing encryption key>
SESSION_SECRET=<preserve the existing secret>
INTERNAL_CRON_TOKEN=<preserve the existing cron token>
```

Copy the existing values for configured provider/OAuth credentials, widget signing,
webhook secrets, and other integrations from the old installation through your
secure server editor or secret manager. Keep keys and tokens out of chat and Git.
Do not regenerate encryption keys when moving an existing database. Use the full
[environment template](../.env.example) for optional integrations.

Browser and runtime Supabase settings must identify the **same** project. Public
`VITE_*` values are baked into the image: rebuild after changing them. Runtime
secrets are loaded from `.env.production` and are excluded from Docker build layers.
Update Supabase Auth site/redirect URLs and each provider's OAuth/webhook callbacks
to the deployed HTTPS hostname. Preserve existing scheduled-job tokens and point
their base URL to this host through the established database administration process.
No migration/reset command is part of this web-server replacement.

## 5. Validate configuration and build the Docker image

```sh
cd /opt/cyloo/app
export APP_COMMIT=$(git rev-parse HEAD)
test -z "$(git status --porcelain)" || { echo 'Commit or remove source edits before deployment.'; exit 1; }
sudo env APP_COMMIT="$APP_COMMIT" docker compose -f docker-compose.aws.yml --env-file .env.production config --quiet
sudo env APP_COMMIT="$APP_COMMIT" docker compose -f docker-compose.aws.yml --env-file .env.production build --pull app
sudo docker image inspect "cyloo/app:$APP_COMMIT" --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}'
```

The last command must print the expected Git SHA. The Dockerfile runs public-env,
branding, typography, and utility checks, builds the Node server, and applies the
SSR/documentation postbuild steps. A failed build must be fixed before cutover.
Do not upload an old `.output` folder from a different hosting target.

Start only the new application first; this does not bind public ports or stop the
old proxy:

```sh
sudo env APP_COMMIT="$APP_COMMIT" docker compose -f docker-compose.aws.yml --env-file .env.production up -d --wait --wait-timeout 180 app
sudo env APP_COMMIT="$APP_COMMIT" docker compose -f docker-compose.aws.yml --env-file .env.production exec -T app wget -qO- http://127.0.0.1:3000/api/public/health
```

Check `commit` against `APP_COMMIT` and confirm `built_at` exists. If startup fails:

```sh
sudo env APP_COMMIT="$APP_COMMIT" docker compose -f docker-compose.aws.yml --env-file .env.production logs --tail 100 app
```

## 6. Switch traffic and enable HTTPS

### Existing nginx installations

If the existing deployment already uses this repository's nginx stack and has
valid certificates, keep that ingress configuration during replacement. The
original `docker-compose.yml` also supports commit-tagged images and the 2 GiB
build heap. Copy the existing runtime environment and certificates into protected
shared storage outside the new checkout. Export `CYLOO_ENV_FILE` and
`CYLOO_CERTS_DIR` to their absolute shared paths, and preserve the old Compose
project name with `-p EXISTING_PROJECT` so containers are replaced in the same
stack. Do not start the Caddy Compose stack on these same ports.

Build the new commit, start a separate candidate without public ports, and verify
its health/build stamp first. Run `docker compose ... run --rm --no-deps proxy
nginx -t` with the new source and shared certificate paths before cutover. Then
recreate the existing stack with `up -d --wait --force-recreate`; verify the public
commit and worker headers. Keep the old image and protected source/configuration
backup for rollback. Delete the old checkout only after confirming no running
container has a bind mount under it. This path preserves existing TLS management;
check its certificate renewal service uses the shared certificate location.

### New automatic HTTPS installations

Inspect current listeners and containers before replacing an existing installation:

```sh
sudo ss -ltnp '( sport = :80 or sport = :443 )'
sudo docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Ports}}'
```

On a new server, confirm DNS points to this server and start the new proxy. On the
same existing server, stop **only the identified old web proxy/service** that owns
ports 80/443 after section 5 succeeds. Do not stop a database or WhatsApp worker.
The old proxy name must be confirmed from the actual server; there is no assumed
container ID or service name in this guide.

```sh
sudo env APP_COMMIT="$APP_COMMIT" docker compose -f docker-compose.aws.yml --env-file .env.production up -d --wait --wait-timeout 180 proxy
sudo env APP_COMMIT="$APP_COMMIT" docker compose -f docker-compose.aws.yml --env-file .env.production logs --tail 50 proxy
```

[Caddy obtains and renews HTTPS certificates](https://caddyserver.com/docs/automatic-https)
when DNS, reachability on 80/443, and persistent certificate storage are correct.
Its named volumes retain certificates across app updates. The existing nginx
Compose file is an alternative; do not start both proxies on the same ports.

## 7. Verify the public release

Use the built image's read-only verifier; the EC2 host does not need Node installed:

```sh
sudo docker run --rm --entrypoint node "cyloo/app:$APP_COMMIT" scripts/verify-deployment.mjs https://crm.rashfolio.com --commit "$APP_COMMIT"
curl --fail --silent --show-error https://crm.rashfolio.com/api/public/health/ready
curl --fail --silent --show-error -I https://crm.rashfolio.com/sw.js
```

The verifier requires the expected commit/build stamp and a revalidating worker.
`/sw.js` must have `Cache-Control: no-cache, max-age=0, must-revalidate` or an
equivalent policy. A liveness `status: ok` alone does not prove a new release.

In a browser, verify the updated landing page, sign-in, admin dashboard, a test
customer/deal, messaging, callbacks, uploads, and enabled provider integrations
with approved test accounts. Do not send campaigns to real customers to smoke-test
a deployment. The separate database extension-catalog audit remains a deployment
check through approved database access; the currently configured RPC cannot run it.

## 8. Remove the old AWS installation after verification

The exact old server paths and resource IDs have not been supplied. This section
does not guess them or execute removal. Before deleting the old release:

1. Record its exact source path, image tag/digest, container/service IDs, mounted
   directories, volumes, and scheduled jobs. Confirm none are used by the new stack.
2. Make a protected backup of the old environment, integration encryption keys,
   local uploads/worker-session files, and old source. Keep an EBS snapshot and the
   previous known-good image for your rollback retention period.
3. Verify section 7 and the real user flows. Stop the specific retired web container
   or service, then remove only its confirmed container IDs. Keep independently
   deployed WhatsApp workers and their credential/session storage.
4. Delete the confirmed retired **source/build directory** only after checking its
   resolved path and backups. It must not be `/opt/cyloo/app`, the current checkout,
   shared uploads, `.env.production`, certificates, database data, or a parent directory.
5. After the retention period, remove only the explicitly identified old image
   tag/image ID. For ECS, stop obsolete tasks through the service, then remove
   unreferenced ECR image digests under a reviewed lifecycle policy. Source files
   are not manually deleted inside Fargate containers.

Do not use `docker compose down --volumes`, `docker system prune --volumes`, a
wildcard `rm -rf`, or blanket EC2/ECR deletion as a cleanup shortcut. The new
certificate volumes and any old persistent business data must survive. Supply
the instance/SSH details and exact old path so the final removal can be targeted.

## 9. Future releases and rollback

Before updating, record the running app's image tag:

```sh
cd /opt/cyloo/app
mkdir -p .deploy-state
chmod 700 .deploy-state
export APP_COMMIT=$(git rev-parse HEAD)
sudo env APP_COMMIT="$APP_COMMIT" docker compose -f docker-compose.aws.yml --env-file .env.production images app
git rev-parse HEAD > .deploy-state/previous-commit
test -z "$(git status --porcelain)" || { echo 'Working tree is not clean.'; exit 1; }
git fetch origin main
export NEXT_COMMIT=$(git rev-parse origin/main)
git checkout --detach "$NEXT_COMMIT"
export APP_COMMIT="$NEXT_COMMIT"
sudo env APP_COMMIT="$APP_COMMIT" docker compose -f docker-compose.aws.yml --env-file .env.production build --pull app
sudo env APP_COMMIT="$APP_COMMIT" docker compose -f docker-compose.aws.yml --env-file .env.production up -d --wait --wait-timeout 180 --force-recreate app proxy
sudo docker run --rm --entrypoint node "cyloo/app:$APP_COMMIT" scripts/verify-deployment.mjs https://crm.rashfolio.com --commit "$APP_COMMIT"
```

Keep the old image until this succeeds. If the update fails, restore the previous
checkout and recreate using its **existing** image rather than rebuilding it:

```sh
export APP_COMMIT=$(cat .deploy-state/previous-commit)
git checkout --detach "$APP_COMMIT"
sudo env APP_COMMIT="$APP_COMMIT" docker compose -f docker-compose.aws.yml --env-file .env.production up -d --no-build --wait --wait-timeout 180 --force-recreate app proxy
sudo docker run --rm --entrypoint node "cyloo/app:$APP_COMMIT" scripts/verify-deployment.mjs https://crm.rashfolio.com --commit "$APP_COMMIT"
```

This rollback assumes the previous release used this same Compose layout and its
image is retained. For the first migration, restart the recorded old stack and
restore its DNS target if needed. Web rollback does not reverse database migrations.

## GitHub verification and remaining gates

The [Docker verification workflow](../.github/workflows/docker-verify.yml) builds
the real Dockerfile, starts its non-root image with synthetic configuration,
checks the release/cache policy, and validates the EC2 Compose and Caddy files.
Its test image is not a production image: build again with your real public
Supabase settings before deployment. It neither publishes to AWS nor deletes data.

The main CI workflow still reports existing repository-wide lint debt (1,087
errors measured before this AWS packaging work, mainly explicit `any` types).
Those errors have not been hidden or disabled. The existing ECS workflow requires
successful full CI for its exact commit and therefore remains blocked until its
release gates pass. A passing Docker check is not a claim that all application,
tenant-isolation, catalog-audit, or integration checks have passed in production.
