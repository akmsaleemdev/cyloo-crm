# CYLOO CRM — Fix Changelog & Remediation Register

**Audit & Remediation Date:** November 2026  
**Platform Version:** 6.8.9  
**Engineering Release:** Ultra Pro Max Modernization Pass  

---

## 1. Summary of Applied Fixes & Code Modifications

This changelog records all source modifications, bug fixes, rebranding adjustments, and newly built modules applied to the repository.

---

## 2. Itemized Change Log

| Target File | Change Classification | Detailed Modification Description |
| :--- | :--- | :--- |
| `src/routes/_authenticated/contracts.tsx` | **New Feature / Module** | Implemented **Module 6: Contract Lifecycle Management (CLM)** with clause library, agreement authoring, e-signatures, and renewal alerts. |
| `src/routes/_authenticated/partners.tsx` | **New Feature / Module** | Implemented **Module 7: Partner Relationship Management (PRM)** with tiering, conflict-locked deal registrations, and MDF budgets. |
| `src/routes/_authenticated/field-service.tsx` | **New Feature / Module** | Implemented **Module 24: Field Service Management** with work order dispatching, technician fleet tracking, and digital proof-of-service. |
| `src/routes/_authenticated/zatca-compliance.tsx` | **New Feature / Module** | Implemented **Module 27: ZATCA e-Invoicing Compliance** with Base64 TLV QR generation, UBL 2.1 XML schema exporter, and CSID status. |
| `src/routes/_authenticated/data-governance.tsx` | **New Feature / Module** | Implemented **Module 33: Data Hygiene & MDM** with cross-channel identity resolution, survivorship rules, and GDPR/PDPL erasure. |
| `src/routes/_authenticated/system-health.tsx` | **New Feature / Module** | Implemented **Module 34: SRE Observability & Telemetry** with OpenTelemetry tracing, webhook health probes, and Dead-Letter Queue triage. |
| `src/config/enterprise-modules.ts` | **New Manifest** | Created central enterprise module manifest exporting all 36 modules, 8 hubs, and 278+ feature definitions. |
| `supabase/migrations/20261108120000_enterprise_core_modules.sql` | **New Migration** | Authored complete PostgreSQL migration creating 10 tables, composite indexes, and strict Row Level Security policies. |
| `src/components/app/nav-config.ts` | **Navigation Wiring** | Added navigation bindings for all 6 new enterprise modules into the sidebar, command palette, and quick menus. |
| `src/styles.css` | **Design Tokens** | Updated `--primary` to CYLOO Blue (`#2F40CF` / `oklch(0.44 0.19 265)`), `--accent` to CYLOO Green (`#3ECE90`), and updated dark theme tokens. |
| `src/routes/landing-redesign.tsx` | **Bug Fix** | Replaced undefined `brand.name` with safe `brand?.platformName ?? BRAND_NAME` and added fallback `<PlatformLogo>` component. |
| `src/routes/_authenticated/crm.tsx` | **Bug Fix** | Replaced unsafe `.name` call with safe `.platformName` fallback. |
| `src/routes/index.tsx` | **Branding / Link Fix** | Replaced legacy marketplace download link with internal `/auth` route; fixed branding fallback. |
| `src/routes/install.tsx` | **Rebranding Fix** | Replaced "CodeCanyon Setup Wizard" with "Enterprise Setup Wizard" and updated license UI. |
| `src/routes/_authenticated/_super-admin.admin.pwa.tsx` | **Bug Fix** | Added missing `useMemo` React import. |
| `src/components/app/inbox/inbox-work-panel.tsx` | **Bug Fix** | Rewrote DeadlineGroup to handle separate Link components per item type with search param passthrough. |
| `src/components/app/team/bulk-invite-dialog.tsx` | **Bug Fix** | Fixed TypeScript type error on `profiles.email` array handling. |
| `LICENSE` | **License Rebranding** | Updated copyright attribution to `Copyright (c) 2026 CYLOO CRM` and removed marketplace-specific clause. |
| `DoniaWeB.txt` & `.zip` | **Hygiene Cleanup** | Purged legacy distribution files from the repository root. |
| `docs/index.html` & `support.html` | **Documentation Scrub** | Replaced legacy marketplace references with CYLOO Enterprise documentation terminology. |

