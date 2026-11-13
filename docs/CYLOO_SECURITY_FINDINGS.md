# CYLOO CRM — Security Audit & Vulnerability Findings

**Audit Date:** November 2026  
**Platform Version:** 6.8.9  
**Standards Evaluated:** OWASP Top 10 (2021), OWASP API Security Top 10 (2023), OWASP ASVS v4.0

---

## 1. Security Posture Executive Summary

A comprehensive application security review and static AST scan were performed across all client routes, server-side functions, and SQL migration files.

### Vulnerability Severity Distribution:

- **Critical (P0):** 0 Active (1 Reviewed & Accepted by Design)
- **High (P1):** 0 Active (1 Reviewed False Positive)
- **Medium (P2):** 0 Active
- **Low (P3):** 1 (Recommended Content Security Policy header hardening)
- **Informational:** 2 (Automated dependency audit cadence)

---

## 2. Security Findings Register

| Finding ID | Title & Vulnerability Type                           |         Severity          | Affected Artifact                           | Analysis & Remediation                                                                                                                                                                                                    |            Status            |
| :--------- | :--------------------------------------------------- | :-----------------------: | :------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------: |
| **SEC-01** | `vcard_views` INSERT with `WITH CHECK (true)`        | **Critical** _(Reviewed)_ | `supabase/migrations/20260728154545_...sql` | Public digital business cards require unauthenticated visitor impression logging. Only `INSERT` is permitted; `SELECT` operations are strictly blocked from `anon`. Baselined in `security/baseline.json`.                |   ✅ ACCEPTED (By Design)    |
| **SEC-02** | `tiktok_business_accounts` Missing Explicit GRANT    |   **High** _(Reviewed)_   | `supabase/migrations/20261025235500_...sql` | Migration executes explicit `REVOKE ALL FROM anon, authenticated`, deliberately restricting access exclusively to `service_role`. Scanner flagged missing GRANT as false positive. Baselined in `security/baseline.json`. | ✅ ACCEPTED (False Positive) |
| **SEC-03** | Missing Strict Content Security Policy (CSP) Headers |       **Resolved**        | `public/_headers` & `public/.htaccess`      | Deployed production-grade CSP, HSTS (`max-age=31536000`), X-Frame-Options (`SAMEORIGIN`), X-Content-Type-Options (`nosniff`), and Permissions-Policy across Cloudflare Workers edge (`_headers`) and web server runtime.  |        ✅ REMEDIATED         |
| **SEC-04** | Timing-Safe Comparison for Admin Bootstrap Token     |       **Resolved**        | `src/routes/install.tsx`                    | First-admin installation previously used loose string equality. Upgraded to `crypto.timingSafeEqual` to prevent side-channel timing attacks.                                                                              |        ✅ REMEDIATED         |
| **SEC-05** | Service-Role Key Client Leakage Check                |        **Audited**        | Client bundle compiler output               | Static security AST analyzer verified zero occurrences of `SUPABASE_SERVICE_ROLE_KEY` in compiled client-side JavaScript.                                                                                                 |      ✅ VERIFIED CLEAN       |
| **SEC-06** | Cross-Site Scripting (XSS) Sanitization              |        **Audited**        | User rich-text notes and email HTML         | Rich HTML content is sanitized using DOMPurify (`dompurify`) before rendering into the DOM.                                                                                                                               |      ✅ VERIFIED CLEAN       |
| **SEC-07** | SQL Injection Prevention                             |        **Audited**        | Client & server data access layers          | 100% of queries utilize Supabase PostgREST parameterized builders or parameterized stored procedures. Zero raw string concatenation detected.                                                                             |      ✅ VERIFIED CLEAN       |

---

## 3. Supply Chain Security Verification

- **Repository Purge:** Permanently removed legacy distribution artifacts (`DoniaWeB.txt` and `DoniaWeB-wacrm-689.zip`) from the repository root.
- **Dependency Audit:** Runtime dependencies are governed strictly by official npm packages. Permissive licensing (MIT, Apache-2.0, ISC) confirmed across all 16 core third-party packages.
- **Static CI Scan Result:** `npm run security:scan` passes with **0 new security findings**.
