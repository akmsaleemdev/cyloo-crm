# CYLOO CRM — Production Deployment & DevOps Runbook

**Version:** 6.8.9  
**Platform:** CYLOO CRM Enterprise SaaS  
**Target Environments:** Cloudflare Workers (Primary Edge) | Docker Compose (Self-Hosted)  
**Audit Date:** November 2026  
**Status:** Comprehensive Production Deployment Guide  

---

## 1. Prerequisites & Required Infrastructure Accounts

Before provisioning CYLOO CRM in a production environment, ensure the following infrastructure accounts and resources are configured:

1. **Cloudflare Account:** Cloudflare Workers Paid plan, custom domain with DNS managed via Cloudflare, and SSL set to "Full (Strict)".
2. **Supabase Project:** Supabase PostgreSQL instance (Pro or Enterprise tier recommended), Supabase Auth enabled, and Supabase Storage buckets provisioned.
3. **AI Provider API Key:** OpenAI API Key, OpenRouter Key, or Anthropic API Key for the Vercel AI SDK runtime.
4. **Communication Provider Accounts (Optional by Feature):**
   - Meta for Developers App (WhatsApp Cloud API & Instagram Messenger).
   - TikTok for Developers App (TikTok Business Messaging).
   - Outbound SMTP Credentials (SendGrid, AWS SES, Resend, or Mailgun).

---

## 2. Environment Configuration Matrix (`.env.production`)

Create `.env.production` in the project root:

```bash
# ==============================================================================
# CYLOO CRM — Production Environment Configuration
# ==============================================================================

# Application Identity & Branding
NODE_ENV=production
VITE_APP_MODE=production
BRAND_NAME=CYLOO
VITE_APP_NAME="CYLOO CRM"
VITE_APP_URL="https://app.yourdomain.com"

# Supabase Managed Database & Auth Gateway
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Supabase Transaction Pooler (Port 6543)
DATABASE_URL="postgres://postgres.your-project:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Cloudflare Workers Deployment Target
CLOUDFLARE_WORKER_NAME="cyloo-crm-prod"
CLOUDFLARE_DOMAIN="app.yourdomain.com"
CLOUDFLARE_API_TOKEN="cf_api_token_here..."
CLOUDFLARE_ACCOUNT_ID="cf_account_id_here..."

# Initial Super-Admin Bootstrap Guard (Timing-Safe Token)
# Generate via: openssl rand -hex 32
SETUP_BOOTSTRAP_TOKEN="a1f9c83e74b26d8e5f1029384756..."

# Internal Background Job Webhook Security
CYLOO_CRON_BASE_URL="https://app.yourdomain.com"
CYLOO_CRON_TOKEN="b2e8d9c0a1f4..."

# Vercel AI SDK Core Model Provider
OPENAI_API_KEY="sk-proj-..."
AI_MODEL_DEFAULT="gpt-4o"
```

---

## 3. Database Migration Deployment Procedure

CYLOO CRM manages 237 ordered SQL migration files in `supabase/migrations/`.

### 3.1 Applying Migrations via Supabase CLI
```bash
# 1. Authenticate with Supabase CLI
npx supabase login

# 2. Link repository to production Supabase project
npx supabase link --project-ref your-project-ref

# 3. Push all pending migrations to the production database
npx supabase db push

# 4. Verify migration state
npx supabase migration list
```

### 3.2 Vault Secret Injection
Inject the required cron security secrets directly into `pg_vault`:

```sql
-- Execute inside Supabase SQL Editor
SELECT vault.create_secret('https://app.yourdomain.com', 'cyloo_cron_base_url');
SELECT vault.create_secret('YOUR_CRYPTOGRAPHIC_CRON_TOKEN', 'cyloo_cron_token');
```

---

## 4. Primary Deployment Target: Cloudflare Workers (Edge)

### 4.1 Automated Build Pipeline
CYLOO CRM includes a dedicated Cloudflare bundler script (`scripts/build-cloudflare.mjs`) that builds TanStack Start with Nitro:

```bash
# 1. Run all preflight code quality and branding audits
npm run audit:branding
npm run prebuild
npm run security:scan

# 2. Execute Cloudflare production bundle
npm run build:cloudflare

# 3. Deploy worker bundle to Cloudflare Edge Network
npm run deploy:cloudflare
```

### 4.2 Cloudflare Wrangler Configuration (`wrangler.toml`)
Ensure `wrangler.toml` defines the required Node.js compatibility flags:

```toml
name = "cyloo-crm-prod"
main = ".output/server/index.mjs"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".output/public"
binding = "ASSETS"

[vars]
NODE_ENV = "production"
VITE_APP_MODE = "production"
```

---

## 5. Alternative Deployment Target: Docker Compose (Self-Hosted)

For on-premises enterprise environments requiring data residency inside a private VPC, execute via Docker:

```bash
# 1. Build and start containers in detached mode
docker compose -f docker-compose.yml up -d --build

# 2. View running application logs
docker compose logs -f app

# 3. Scale background QR worker instances
docker compose up -d --scale qr-worker=2
```

---

## 6. Post-Deployment Verification & Initial Setup Wizard

1. **Verify Root Health:** Open `https://app.yourdomain.com/` in a browser. Confirm that the landing page renders with CYLOO CRM branding and zero console errors.
2. **Access Setup Wizard:** Navigate to `https://app.yourdomain.com/install`.
3. **Authenticate Bootstrap Token:** Provide the `SETUP_BOOTSTRAP_TOKEN` configured in `.env.production`.
4. **Provision Primary Super-Admin:** Supply the initial system administrator name, email, and strong password.
5. **Organization Creation:** Create the default organization and workspace to complete onboarding.
6. **Revoke Bootstrap Token:** Once the super-admin account is created, clear `SETUP_BOOTSTRAP_TOKEN` from the environment or mark bootstrap as complete in the database.

---

## 7. Operational Runbook & Disaster Recovery

### 7.1 Automated Database Backups
- Supabase automatically takes daily full backups and continuous write-ahead log (WAL) backups for Point-in-Time Recovery (PITR).
- To create a manual snapshot prior to major updates:
  ```bash
  npx supabase db dump -f backup_$(date +%Y%m%d).sql --data-only
  ```

### 7.2 Zero-Downtime Rollback Procedure
If a production worker deployment introduces regressions:
1. Open Cloudflare Dashboard $\rightarrow$ Workers & Pages $\rightarrow$ `cyloo-crm-prod` $\rightarrow$ Deployments.
2. Locate the previous stable deployment version.
3. Click **Rollback** to instantly route 100% of global traffic back to the prior worker version in $< 5\text{ seconds}$.

