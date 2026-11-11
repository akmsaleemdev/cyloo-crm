# CYLOO baseline discovery report

Date: 2026-11-11
Scope: read-only repository discovery and local baseline checks

## Executive summary

CYLOO is a TypeScript TanStack Start application using React 19, Vite, Nitro, Supabase, and Tailwind. The repository also contains a separate Expo/React Native mobile application and a small QR worker. The primary web application is not a conventional Next.js or Laravel application; route discovery is file based under `src/routes`.

No source implementation was changed during discovery. Existing worktree changes were preserved:

- `app.js` and `app.cjs`: one-line formatting change.
- `docs/script.js`: formatting-only rewrite according to the diff inspection.
- `security.json`: untracked task specification supplied in the worktree.

## Verified technology stack

| Area | Evidence |
| --- | --- |
| Runtime | Node v22.20.0; npm 11.9.0 |
| Web framework | TanStack Start with TanStack Router |
| Build | Vite 8, Nitro, React Vite plugin |
| UI | React 19, Tailwind CSS 4, Radix UI, Lucide |
| Data/auth | Supabase JS 2.110.5 and Supabase migrations/config |
| Client data | TanStack React Query 5 and TanStack Virtual |
| Mobile | Expo/React Native application under `mobile/` |
| Worker | Node QR worker under `qr-worker/` |
| Tests | Vitest, Testing Library, Playwright, axe-core |
| Deployment | Node server, Netlify, Docker, and Cloudflare build/deploy scripts are present |

## Repository shape

- 2,396 tracked files.
- 1,822 tracked TypeScript/TSX files.
- 1,751 files under `src/` in the working tree.
- 380 Supabase migration files.
- 22 test files were counted by the initial test-tree query; the repository also contains test-adjacent probes and configuration.
- Route files are under `src/routes`, including authenticated routes and public API/webhook routes.

## Architecture observations

The browser-facing application uses Supabase client access for tenant-scoped data and TanStack Start server functions for server-side operations. Server-only boundaries and service-role access are present in files such as `src/integrations/supabase/client.server.ts` and `src/lib/*/*.server.ts`. Database migrations contain RLS enablement, workspace/organization policies, and `SECURITY DEFINER` helper functions.

The repository is already a multi-application workspace in practice, but it is not structured as a package-manager workspace. A monorepo migration should therefore not be assumed to improve performance or security; it requires a separate dependency/build-boundary assessment.

## Baseline command results

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run security:policies` | Pass | Restored `security/policy-assertions.json`; both repository hardening assertions hold. |
| `npm run preflight` | Blocked | `node_modules/.bin/tsgo` and `node_modules/.bin/eslint` are missing. |
| `npm run typecheck` | Did not complete in the available baseline window | The configured `tsgo` command did not produce a result before it was stopped. |
| Targeted ESLint (`app.js`, `app.cjs`, `docs/script.js`) | Pass | `npx --no-install eslint ...` completed successfully. |
| `npm run build:server` | Blocked | Vite is absent from the local `node_modules`; the command reports `'vite' is not recognized`. |
| `npm audit --omit=dev --audit-level=high` | Fail | Four production-tree advisories were reported: DOMPurify (critical), undici (high), zod (high), and seroval (moderate). |
| `npm audit fix --omit=dev` | Blocked | The remediation command did not complete in the available local environment. |
| Automated tests | Pending | Must run after dependencies/tooling are restored. |

## Initial risks and follow-up

1. Restore a reproducible dependency installation from the committed lockfile and verify the expected binaries are present.
2. Run typecheck, full lint, security scanning, focused RLS tests, production build, and the relevant Playwright smoke suite.
3. Review route-level data fetching and bundle output using measured build artifacts before making performance changes.
4. Do not classify production readiness until the blocked checks have executed successfully and results are recorded.

## Limitations

This is a local repository baseline. No production site, database, staging environment, or external deployment was modified or probed. No claim about production latency, tenant isolation in a live database, or deployed secret configuration can be made from this baseline alone.
