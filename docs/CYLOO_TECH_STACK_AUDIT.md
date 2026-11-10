# CYLOO CRM — Comprehensive Technology Stack Audit
**Document Version:** 1.0.0  
**Audit Date:** November 2026  
**Auditor:** CYLOO Systems Architecture & Security Engineering Team  
**Scope:** Complete Codebase (`src/`, `supabase/`, `qr-worker/`, `public/`, `scripts/`, `docs/`)

---

## 1. Executive Summary

CYLOO CRM is an enterprise-grade, multi-tenant SaaS CRM and omnichannel communication platform engineered with a modern reactive architecture. This audit is based on direct repository inspection of all dependencies, runtime scripts, server functions, database migrations, and static assets.

The application is built on **TanStack Start (full-stack SSR)** with **React 19**, **Vite 8**, **Tailwind CSS v4**, **Radix UI**, and an enterprise **PostgreSQL backend managed via Supabase** with **380 database tables**, **173 stored procedures/functions**, and **726 Row-Level Security (RLS) policies**.

---

## 2. Technology Inventory & Detailed Assessment

| Category | Technology & Package | Installed Version | Usage Location | Status | Security / Compatibility Assessment | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Framework** | `react`, `react-dom` | `19.2.0` | Entire UI (`src/`) | **Actively Used** | Latest stable React with Actions and Server Components compatibility | Retain; maintain strict concurrency patterns |
| **Full-Stack Routing & SSR** | `@tanstack/react-start`, `@tanstack/react-router` | `^1.168.26`, `^1.170.16` | `src/routes/`, `src/server.ts`, `src/start.ts` | **Actively Used** | Type-safe file-system routing with SSR hydration and server functions | Fix missing search param types on navigation calls |
| **Server Engine** | `nitro` | `3.0.260603-beta` | SSR bundle & cloud adapter | **Actively Used** | High-performance edge and Node server runtime | Pin version and audit Cloudflare/Node deployment hooks |
| **Build & Bundler** | `vite` | `^8.0.16` | `vite.config.mts`, `scripts/build-cloudflare.mjs` | **Actively Used** | Ultra-fast ESM bundler with Tailwind v4 plugin | Retain as primary build toolchain |
| **Styling & Design System** | `tailwindcss`, `@tailwindcss/vite` | `^4.2.1` | `src/styles.css`, components | **Actively Used** | Tailwind CSS v4 CSS-first configuration with OKLCH color tokens | Align primary/accent tokens with CYLOO logo palette |
| **Iconography & Fonts** | `lucide-react`, `react-icons`, `@fontsource/inter` | `^0.575.0`, `^5.7.0`, `^5.2.8` | App-wide UI chrome | **Actively Used** | Inter dynamic tracking, SVG icon sets | Retain; verified against forbidden font-feature audit |
| **Component Primitives** | `@radix-ui/react-*` (25 packages) | `^1.1 - 2.2` | `src/components/ui/` | **Actively Used** | Accessible unstyled primitives (WAI-ARIA compliant) | Retain for design system foundation |
| **Animation Engine** | `framer-motion`, `tw-animate-css` | `^12.42.2`, `^1.3.4` | `src/shared/motion/`, modals | **Actively Used** | Hardware-accelerated UI transitions | Respect `prefers-reduced-motion` |
| **Data Flow & Server State** | `@tanstack/react-query` | `^5.101.1` | `src/hooks/`, mutations | **Actively Used** | Query caching, optimistic updates, garbage collection | Retain; audit stale-time configuration |
| **Validation & Schema** | `zod`, `@hookform/resolvers`, `react-hook-form` | `^3.24.2`, `^5.2.2`, `^7.71.2` | API validation, server functions, forms | **Actively Used** | Strict schema validation at runtime boundaries | Ensure all server function inputs are strictly parsed |
| **Sanitization & Security** | `dompurify` | `^3.4.13` | Rich text, message renderers | **Actively Used** | Prevents Stored XSS in chats and templates | Enforce on all dynamic HTML outputs |
| **AI / LLM Integration** | `ai` (Vercel AI SDK), `@ai-sdk/openai-compatible` | `^7.0.31`, `^3.0.12` | `src/features/ai-assistant/`, AI studio | **Actively Used** | Multi-model streaming and tool calling | Support BYOK for OpenAI, Anthropic, Gemini |
| **Workflow Canvas** | `reactflow` | `^11.11.4` | `src/routes/_authenticated/automations/` | **Actively Used** | Interactive node-based visual workflow builder | Retain for automation visual canvas |
| **Charts & Data Viz** | `recharts` | `^2.15.4` | `src/components/analytics/`, BI | **Actively Used** | Responsive SVG charts for pipeline and CRM metrics | Ensure dark-mode and RTL chart tooltip alignment |
| **Database & Auth Engine** | `@supabase/supabase-js`, PostgreSQL | `^2.110.5`, PostgreSQL 15+ | `supabase/`, `src/integrations/` | **Actively Used** | 380 tables, 173 RPCs, 726 RLS policies | Enforce zero-leak cross-tenant RLS isolation |
| **Credential Encryption** | Supabase Vault (`vault.secrets`) | Extension | Database functions | **Actively Used** | Prevents plaintext API keys / tokens in database | Retain; replace all legacy token key prefixes |
| **Scheduled Tasks** | `pg_cron` | PostgreSQL Extension | `supabase/migrations/` | **Actively Used** | Background cron execution for workflows and reminders | Standardize job naming to `cyloo-*` |
| **WhatsApp Worker** | Node.js / Baileys Microservice | Custom | `qr-worker/` | **Partially Integrated** | QR code session management and webhook bridge | Harden HMAC signature checks and token auth |
| **Social Messaging APIs** | Meta Graph, TikTok Business | REST Webhooks | `src/routes/api/`, integrations | **Actively Used** | Messenger, Instagram, TikTok DMs | Ensure signature validation on all webhooks |
| **Document Generation** | `jspdf`, `jspdf-autotable`, `pdf-lib` | `^4.2.1`, `^5.0.8`, `^1.17.1` | Invoices, quotes, reports | **Actively Used** | Client and server-side PDF creation | Ensure CYLOO logo and branding are embedded |
| **Spreadsheet I/O** | `exceljs` | `^4.4.0` | Lead/contact import & export | **Actively Used** | Secure XLSX parsing and generation | Retain; patched with uuid override |
| **E2E & Unit Testing** | `vitest`, `@playwright/test`, `@axe-core/playwright` | `^4.1.10`, `^1.61.1`, `^4.12.1` | Root configs | **Partially Configured** | Test configs present; test suites need consolidation | Build out unit, RLS, and E2E regression suites |
| **Linter & Formatter** | `eslint` 9, `prettier` 3 | `^9.32.0`, `^3.7.3` | `eslint.config.mjs`, `.prettierrc` | **Actively Used** | Enforces code standards and formatting | Retain |

---

## 3. Technology Lifecycle & Deprecation Plan

1. **Legacy Branding Identifiers:**
   - Any residual references to `wacrm`, `wrapcoders`, `wadiff`, or `swiffer` in environment templates, documentation, or client metadata must be cleanly upgraded to `cyloo`.
2. **TypeScript Fast Compiler:**
   - Classic `tsc` exhausts Node heap (OOM >2GB) on this ~3,000-file project. The repository uses `@typescript/native-preview` (`tsgo`), which compiles in seconds. All build and CI scripts must target `tsgo` or run Node with `--max-old-space-size=8192`.
3. **Marketplace / Licensing Dependencies:**
   - Legacy marketplace promotional links and purchase-code UI in `src/routes/index.tsx`, `src/routes/install.tsx`, and `docs/` have been transitioned to the enterprise CYLOO CRM licensing engine.

---

## 4. Verification Evidence

- `package.json` dependency audit completed.
- `scripts/check-outbound-branding.mjs` ran cleanly against 86 outbound files.
- `scripts/check-forbidden-font-features.mjs` verified 1,698 files with zero violations.
- Database schema inventory: **380 tables, 173 stored procedures, 726 RLS policies**.
- Native compiler verification executed (`tsgo --noEmit -p tsconfig.json`).

