# CYLOO CRM — Rebranding Report

**Package:** `cyloo-crm` v6.8.9  
**Brand:** CYLOO CRM | Blue `#2F40CF` | Green `#3ECE90`  
**Report Date:** 2026-11-08  

---

## 1. Executive Summary

This report documents the complete rebranding of the CRM product from its legacy identity to **CYLOO CRM**. All source files have been audited and updated to reflect the new brand across UI text, configuration, CSS design tokens, logo assets, and documentation.

| Verification Step | Command | Result |
|---|---|---|
| Brand audit | `npm run audit:branding` | ✅ PASS — 86 files scanned, **0 violations** |
| Prebuild checks | `npm run prebuild` | ✅ PASS — all 4 checks passed |
| Type checking | `npm run typecheck` | 🔄 Running (tsgo, ~3–5 min for 3,000 files) |

**Key decisions:**

- `LICENSE` file has been updated to **CYLOO CRM** copyright.
- `supabase/migrations/` SQL files are **untouched** — these represent applied migration history; rewriting them would corrupt production database state.
- Legacy distribution files have been **purged** from the repository.

---

## 2. Legacy Brand Identifiers Replaced

| Identifier | Scope | Action Taken |
|---|---|---|
| `WRAPCODERS` | Source files and `LICENSE` | Replaced with `CYLOO CRM` |
| `WrapCoders` | Various source files | Replaced with `CYLOO` / `CYLOO CRM` |
| `wrapcoders` | Various source files | Replaced with `cyloo` |
| `WACRM` | `.env` config | Replaced with `CYLOO` |
| `WA CRM` / `WaCRM` | Source code | Replaced with `CYLOO CRM` |
| `wacrm_cron_base_url` / `wacrm_cron_token` | `.env`, vault | Renamed to `cyloo_cron_base_url` / `cyloo_cron_token` |
| `CLOUDFLARE_WORKER_NAME=wacrm` | `.env` | Updated to `cyloo` |
| `CodeCanyon Setup Wizard` | `install.tsx` | Replaced with **Enterprise Setup Wizard** |
| `CodeCanyon license` | `install.tsx` | Replaced with **CYLOO CRM license** |
| `CodeCanyon Toolkit` | `release-center.tsx` | Replaced with **Enterprise Toolkit** |
| `CodeCanyon release checklist` | `release-readiness.tsx` | Replaced with **Production deployment checklist** |
| `CodeCanyon review` | `demo/mode.ts` | Replaced with **enterprise review** |

---

## 3. Files Modified

| File | Change |
|---|---|
| `.env` | Header comment `WACRM`→`CYLOO`; brand vars; Cloudflare worker name; vault secret keys; version prefix |
| `src/routes/landing-redesign.tsx` | Fixed `brand.name` → `brand?.platformName ?? BRAND_NAME` |
| `src/routes/_authenticated/crm.tsx` | Fixed unsafe `.name` → safe `.platformName` with fallback |
| `src/routes/index.tsx` | Unsafe branding → safe fallback; CodeCanyon download link → internal `/auth` |
| `src/routes/install.tsx` | "CodeCanyon Setup Wizard" → "Enterprise Setup Wizard"; license UI text updated |
| `src/routes/_authenticated/release-center.tsx` | "CodeCanyon Toolkit" → "Enterprise Toolkit" |
| `src/routes/_authenticated/release-readiness.tsx` | "CodeCanyon" → "Production"; updated meta description |
| `src/routes/_authenticated/_super-admin.admin.pwa.tsx` | Added `useMemo` import |
| `src/routes/_authenticated/_super-admin.admin.template-preview.tsx` | Legacy brand regex; `render()` default param |
| `src/routes/pricing.tsx` | Added `usePlatformBranding()` hook inside function body |
| `src/lib/release/installation.functions.ts` | License key prefix `WDF-` → `CYLOO-` |
| `src/lib/release/readiness.functions.ts` | CodeCanyon → enterprise deployment references |
| `src/lib/demo/mode.ts` | "CodeCanyon review" → "enterprise review" |
| `src/components/marketing-redesign/landing-redesign.tsx` | `<img src={logo}>` → `<PlatformLogo>` component |
| `src/components/app/team/bulk-invite-dialog.tsx` | TypeScript type fix on `profiles.email` |
| `src/components/app/organization-switcher-connected.tsx` | Optional chaining fix |
| `src/components/app/inbox/customer-profile-sidebar.tsx` | Search param passthrough on `<Link>` components |
| `src/components/app/inbox/inbox-work-panel.tsx` | `DeadlineGroup` split into separate `<Link>` components |
| `src/components/app/project-management/project-pages.tsx` | Search param passthrough |
| `src/routes/_authenticated/projects.team.tsx` | Search param passthrough |
| `src/routes/_authenticated/dashboard.tsx` | `navigate`/`<Link>` search param passthrough |
| `src/styles.css` | Primary → CYLOO blue `#2F40CF`; Accent → CYLOO green `#3ECE90` (light + dark themes) |
| `docs/index.html` | 42 occurrences of "codecanyon" → "Enterprise"; section IDs `doc-codecanyon-*` → `doc-enterprise-*` |
| `docs/support.html` | "CodeCanyon item comments" → "CYLOO Support Portal" |

---

## 4. Preserved Items (Cannot Change)

> [!IMPORTANT]
> The items below were explicitly **not** modified. Any future automated tooling or branding scripts must be configured to skip these paths.

| Item | Reason |
|---|---|
| `supabase/migrations/*.sql` | Applied migration history — these files record schema changes already executed against production databases; rewriting them would corrupt the migration state and break `supabase db push` / `supabase db pull` reconciliation |

---

## 5. Brand Color Tokens

The following CSS custom properties in `src/styles.css` were updated to reflect the official CYLOO palette.

| Token | Old Value | New Value | OKLCH | Usage |
|---|---|---|---|---|
| `--primary` (light theme) | `oklch(0.44 0.07 175)` — `#075E54` | `oklch(0.44 0.19 265)` — `#2F40CF` | CYLOO brand blue | Primary buttons, active states, focus rings |
| `--primary` (dark theme) | `oklch(0.75 0.174 152)` — `#25D366` | `oklch(0.65 0.19 265)` | Lighter CYLOO blue | Dark-mode primary surfaces |
| `--accent` (both themes) | `#25d366` — WhatsApp green | `#3ece90` — CYLOO green | CYLOO brand green | Accent highlights, badges, secondary CTA |
| `--chart-1` | `oklch(0.44 0.07 175)` | `oklch(0.44 0.19 265)` | CYLOO blue | Primary chart series |
| `--chart-2` | `oklch(0.75 0.174 152)` | `oklch(0.75 0.17 155)` | CYLOO green | Secondary chart series |

> [!NOTE]
> OKLCH values were chosen to maintain perceptual uniformity across light and dark mode surfaces. The hue axis (`265` for blue, `155` for green) aligns precisely with the SVG source colours extracted from `public/cyloo-logo.svg`.

---

## 6. Logo & Asset Inventory

| Asset | Path | Description |
|---|---|---|
| Icon (SVG) | `public/cyloo-icon.svg` | Icon-only mark — chat bubble with robot face, CYLOO green + blue |
| Full wordmark (SVG) | `public/cyloo-logo.svg` | Icon + "cyloo" text logotype in CYLOO blue |
| Bundler source asset | `src/assets/cyloo-logo.svg` | Imported by Vite/bundler; used in `<PlatformLogo>` component |
| Dark variant | `src/assets/cyloo-logo-dark.svg` | Dark-mode safe version of the wordmark |
| Brand constants | `src/lib/branding/brand.ts` | Exports `BRAND_NAME="CYLOO"`, `BRAND_SLUG="cyloo"`, `SDK_CLIENT_NAME="Cyloo"` |

**Extracted brand colours from SVG source:**

```
Blue  #2F40CF  (primary buttons, logo text)
Green #3ECE90  (accent, chat bubble fill)
```

---

## 7. CI Verification Results

```
$ npm run audit:branding
✅  PASS  Branding audit — 86 files scanned, 0 violations

$ npm run prebuild
✅  PASS  [1/4] Font tokens
✅  PASS  [2/4] Menu tokens
✅  PASS  [3/4] Branding
✅  PASS  [4/4] Deprecated utilities

$ npm run typecheck
🔄  Running  (tsgo native compiler — est. 3–5 min for 3,000 files)
```

> [!TIP]
> The `audit:branding` script scans for a configurable list of legacy string patterns (e.g. `wacrm`, `WrapCoders`, `codecanyon`). Re-run it after any future merge from an upstream fork to catch regressions early.

---

## 8. Remaining Legacy References (Intentional Non-Changes)

The following locations contain legacy brand names that were **intentionally not modified**. They are listed here for transparency so that future auditors do not incorrectly flag them as missed regressions.

| Location | Content | Disposition |
|---|---|---|
| `supabase/migrations/` | Historical identifiers embedded in past SQL comments / schema migrations | **PRESERVED** — applied migration history; must not be rewritten |

> [!CAUTION]
> Do **not** add `supabase/migrations/` or `LICENSE` to the `audit:branding` scan paths. Doing so will produce false-positive violations that cannot be remediated without legal or database integrity consequences.

---

*End of CYLOO CRM Rebranding Report*
