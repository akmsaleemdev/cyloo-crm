# Cyloo CRM database security and performance audit — updated 16 November 2026

Project: `mfothsalhfinquaqzlcm` / `cyloo-crm-prod`
Scope: the supplied 14-part SaaS ERP checklist, live Supabase catalogs/advisors/logs, migration history, and database-facing application code.
Outcome: nine corrective migrations applied to production; Postgres SSL enforcement enabled; an encrypted local logical backup was validated. Application fixes remain local until the SSH release. This is an evidence-based audit, not a certification.

## Verified results

| Check                                        |  Before |                             After |
| -------------------------------------------- | ------: | --------------------------------: |
| Public tables without RLS                    | 0 / 391 |                           0 / 391 |
| Per-row auth evaluation advisor findings     |     671 |                                 0 |
| Functions with mutable search paths          |       3 |                                 0 |
| Duplicate-index groups                       |       4 |                                 0 |
| Anonymous-callable security-definer findings |      24 | 5 intentional interfaces retained |
| Authenticated security-definer findings      |      59 |     43 requiring continued review |
| Unindexed foreign-key findings               |     350 |                                 0 |
| Multiple permissive-policy findings          |     202 |             7 cross-role overlaps |
| Unused-index findings                        |     418 |         770; includes new indexes |
| Health advisor findings                      |       0 |                                 0 |

Catalog verification found no invalid indexes, no unvalidated public constraints, no remaining test workspaces, and no client TRUNCATE/REFERENCES/TRIGGER grants. All nine storage buckets are private. The exposed view uses `security_invoker=true`. No public amount/price/total/balance/salary columns use floating-point types.

The database was 54 MB initially and approximately 63 MB after changes, on PostgreSQL 17.11 in Frankfurt. The initial connection sample was 16 against a 60-connection limit. These small-dataset observations are not capacity benchmarks.

## Fixed findings

| Severity    | Problem and correction                                                                                                                                                                                                                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical    | `emit_module_notification` allowed anonymous/authenticated callers to insert notifications for arbitrary users and organizations. EXECUTE is now server-only; PUBLIC inheritance was revoked.                                                                                                                                       |
| High        | `widget_broadcast` allowed arbitrary caller-triggered broadcasts. It is now server-only; existing privileged triggers can still invoke it. Vault-key retrieval and rate-limit mutation RPCs are also server-only.                                                                                                                   |
| High        | `bulk_tag_conversations` authorized only the first conversation. It now validates every conversation and label, rejects mixed workspaces, and bounds batch size. Two composite foreign keys also block bypass through direct table inserts.                                                                                         |
| High        | Workspace creation accepted arbitrary organization IDs. The RPC and direct INSERT policy now require organization owner/admin rights. Client updates cannot move a workspace into another organization.                                                                                                                             |
| High        | Global security events and dead letters were too broadly visible; NULL-workspace dead letters were writable by ordinary users. Access now requires platform superadmin or applicable workspace admin rights. Health probes are platform-admin-only. Direct security-event inserts must be self-attributed and workspace-authorized. |
| High        | Enterprise policies depended on an optional/stale workspace JWT claim. They now check current membership; privacy-erasure records require workspace admin/owner rights. Four composite constraints bind enterprise organization IDs to their workspaces.                                                                            |
| High        | AI lookup tools interpolated input into raw PostgREST expressions. Exact values are quoted and escaped, UUID comparisons are included only for UUID inputs, and workspace/deleted-row predicates remain independent. The customer lookup now queries the actual `contacts` table.                                                   |
| High        | AI generic CRM updates accepted arbitrary columns. Strict per-entity schemas now reject tenant, ownership, relationship, audit, role and other unapproved fields before an update is issued.                                                                                                                                        |
| High        | AI rate limiting called the RPC with incorrect parameter names, interpreted its result incorrectly, and failed open. The corrected server call consumes the returned row and fails closed on errors or malformed results.                                                                                                           |
| High        | CSV exports could execute formula-like strings; Excel exports could interpret database JSON as a formula descriptor. CSV formula text is neutralized, and Excel JSON values become text. Numeric values remain numeric.                                                                                                             |
| Medium      | Inbox search accepted unbounded limits and could join inconsistent workspace references. Results are bounded to at most 100 per kind, query length to 200 characters, and joins enforce workspace and deletion conditions. Assignment RPCs validate active workspace assignees; bulk updates are capped at 200 IDs.                 |
| Medium      | Three functions had mutable search paths. Their paths are now fixed. Client execution was removed from privileged trigger functions and unnecessary anonymous helper grants.                                                                                                                                                        |
| Medium      | Browser roles inherited TRUNCATE, REFERENCES and TRIGGER privileges on hundreds of tables. These grants were revoked. Future postgres-created functions require explicit public-client grants; table defaults no longer grant maintenance privileges.                                                                               |
| Performance | 699 policies were rewritten to cache statement-invariant auth calls or use current membership. Added 82 FK-supporting indexes and two unique indexes; removed four verified duplicate indexes.                                                                                                                                      |

`set_workspace_member_permission_role` also had a high-severity NULL authorization bypass: callers without active workspace membership could pass its `NOT IN` guard. The RPC now denies missing or non-admin roles. A live test reached the unauthorized update before the fix and received SQLSTATE 42501 after it; all test writes rolled back. The login-event RPC is now server-only, so browser clients cannot forge a successful login to clear their lockout counter.

An authenticated `EXPLAIN` on a workspace-filtered contacts query now shows an auth `InitPlan` and an index-only scan. This supports the query-plan correction; it does not establish a latency improvement under real traffic.

## Checklist coverage and remaining work

| Checklist area              | Evidence, limits and next action                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Tenant isolation         | RLS enabled on all 391 public tables. Live tests cover representative same-tenant and cross-tenant reads/writes, tagging, direct FK bypass and enterprise access. Many older relationships still use single-column FKs; review tenant consistency throughout the remaining relationship graph. Every table, role and endpoint was not exercised.                                                                                                 |
| 2. Authentication/access    | Email confirmation and TOTP enrollment/verification are enabled. Leaked-password protection is disabled and requires a Pro plan; the organization is on Free. Credentials, rotation and all session settings remain unverified.                                                                                                                                                                                                                  |
| 3. Authorization            | Internal RPC privileges, client table maintenance grants and several broad policies were repaired. Remaining 43 authenticated-definer notices include authorization helpers and intended RPCs. An unused browser rate-limit helper was removed after the mutation RPC became server-only. Continue least-privilege and finance/HR segregation-of-duties review. Supabase-admin-owned future defaults were not changed.                           |
| 4. Injection/query safety   | Fixed confirmed PostgREST grammar and mass-assignment paths. Reviewed live dynamic-SQL functions: the client-callable sales-document function uses an allowlisted identifier with identifier quoting and bound values. No confirmed raw SQL injection was found in those reviewed paths. This does not prove absence throughout the application. Authenticated/anonymous statement timeouts are 8s/3s; bounded search and bulk operations added. |
| 5. Network/infrastructure   | Mandatory Postgres TLS enforcement was enabled and verified; production health stayed green. The sampled external DB session used TLS. Network CIDRs still permit all IPv4 and IPv6 addresses. Host egress addresses are needed before restricting them. AWS security groups, WAF and administrator access remain unverified.                                                                                                                    |
| 6. Encryption               | BYOK secrets use Supabase Vault and the key-reading RPC is server-only. The local logical backup was encrypted and round-trip verified. Provider at-rest encryption configuration, managed-backup encryption, key rotation, sensitive-field classification/encryption and full credential-table review remain unverified.                                                                                                                        |
| 7. Privacy                  | Security-event exposure and spreadsheet injection corrected. AI tool execution logs still contain inputs/outputs and may hold PII. Define redaction and retention rules, verify erasure/export completeness, and review whether Frankfurt residency is appropriate for the actual customers and contracts. No legal-compliance certification was performed.                                                                                      |
| 8. Backup/availability      | Supabase reports no managed backups and PITR disabled on this Free project. An encrypted local logical backup was created on 16 November 2026 using PostgreSQL 17.11, verified TLS, the existing SSH public key and age. A temporary recipient decrypted it successfully; archive readability and SHA-256 were verified. A separate-database restore and offsite copy remain outstanding.                                                        |
| 9. Migrations               | Nine production migrations match local SQL hashes. The sole older local-only vCard migration remains staged pending isolated integration testing; a blanket push would deploy it. No bootstrap SQL-execution helper exists in the live public schema.                                                                                                                                                                                            |
| 10. Integrity               | Added and validated six composite FKs and client workspace-scope protection. No monetary floating-point columns found by name/type scan. Full ledger immutability, numbering/stock contention, lost-update handling and every legacy relationship require deeper domain testing.                                                                                                                                                                 |
| 11. Audit/monitoring        | Security/audit access reviewed and repaired. Initial 24-hour database logs showed three permission-denied errors, seven protocol logs and one connection log. Cron records showed 13,802 succeeded executions in the inspected window; asynchronous HTTP delivery success was not established. Audit integrity, alert delivery and log retention require operational verification.                                                               |
| 12. Application risks       | Fixed AI filters, patch validation, rate limiting and spreadsheet exports. Reviewed export workspace scoping and its 50,000-row cap. Private storage is verified, but six buckets have no bucket-specific size cap and none have bucket-specific MIME restrictions; global limits and upload-path validation were not fully audited.                                                                                                             |
| 13. Supply chain/operations | A scoped minimatch override cleared all seven moderate development advisories: npm audit now reports zero vulnerabilities. npm and Bun lockfiles agree, and parser compatibility passed. Host patching and incident response remain unverified.                                                                                                                                                                                                  |
| 14. Compliance              | No compliance claim is made. Access-review records, retention requirements, restoration evidence, independent penetration testing, customer residency commitments and applicable regulatory assessment remain outstanding.                                                                                                                                                                                                                       |

Five anonymous-definer interfaces remain intentionally available: invitation-token lookup, public payment-link lookup, verified-domain branding, realtime topic authorization and widget topic authorization. Retaining these is not a blanket security approval; public token expiration/abuse controls merit continued testing.

Nine RLS-without-policy notices are deny-by-default internal tables, including OAuth settings/state and reminder logs. Do not add permissive policies merely to silence the advisor. The one missing primary key is an inaccessible historical settings backup. `pg_net` is non-relocatable in this deployment; it was not dropped/reinstalled to clear the extension-schema notice.

All 274 remaining FK-support indexes were added after checking the affected heaps were at most 24 KB. The migration guards replay on heaps over 64 MiB. Seven overlapping-policy warnings remain where PUBLIC and authenticated roles share a table. Fresh unused-index counters are not grounds for dropping indexes.

The encrypted logical backup is in the ignored local `backups/` directory, with an adjacent SHA-256 file. The backup script is `scripts/backup-supabase-local.ps1`. It uses the SSH public key already on this machine; retain the matching private key and passphrase to recover the archive. The verified TLS root is [Supabase's 2021 Postgres CA](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt). This local snapshot is not an offsite disaster-recovery copy.

## Migration and release record

Applied through the Supabase connector:

1. `20261115172400_database_security_audit_hardening.sql`
2. `20261115172428_database_rls_performance.sql`
3. `20261115172528_database_tenant_foreign_key_indexes.sql`
4. `20261115172845_database_workspace_integrity.sql`
5. `20261115173756_database_workspace_integrity_indexes.sql`
6. `20261115184241_database_policy_consolidation.sql`
7. `20261115184254_database_remaining_foreign_key_indexes.sql`
8. `20261116065221_database_role_assignment_authorization.sql`
9. `20261116070304_database_login_attempt_rpc_privilege.sql`

All migrations used bounded lock/statement timeouts. The additional FK indexes were created on inspected tiny heaps with a 64 MiB replay guard. Policy consolidation preserved 513 OR predicates across 105 groups and 492 untouched policies. A NULL-role assignment bypass was closed. No business records were deleted or rewritten.

The staged `20261114080000_vcard_view_atomic_recording.sql` remains local-only. Do not run a blanket migration push without addressing that staging prerequisite. New local filenames were aligned with the actual Supabase migration ledger instead of fabricating ledger entries.

Database-generated TypeScript types were refreshed from production, adding coverage for 26 previously missing tables and 25 function names. Application changes remain local until the SSH release; the host address and login username have not been supplied.

Rollback policy: use a forward corrective migration for specific incompatibilities. Reopening revoked RPCs or the NULL-role assignment path would reintroduce vulnerabilities. Re-run both live SQL regression scripts in `supabase/tests/` after corrective migrations; their synthetic fixtures roll back.

## Validation

- Default automated suite: **209 tests passed in 40 files**.
- Targeted database/tooling suite: **26 tests passed in 5 files**; an earlier broader targeted suite passed 63 tests.
- Existing security-policy suite: **34 tests passed**.
- Live SQL behavioral regression: **passed**, repeated after the final privilege change; no test workspaces remain.
- Changed-file ESLint: **passed**.
- Security scanner: **no new findings**, but **two legacy baseline findings remain**; this is not a clean historical security bill.
- Two existing security-policy assertions: **passed**.
- Full TypeScript verification on Node 22: passed. Native TypeScript cross-check: passed. Regenerating the schema exposed compiler recursion in a dynamic helpdesk count query; a narrow structural query type fixed it without runtime changes.
- Full production browser E2E, isolated migration replay, restore drills and realistic load/soak tests were not performed.

Existing security baseline findings concern a historical vCard insertion policy and a TikTok table migration lacking explicit grants. Baseline acceptance is not remediation. Advisors reflect the live schema; historical SQL scans have different coverage.

Evidence: `security/database-audit-2026-11-15.json`, `security/database-audit-migration-ledger.json`, policy snapshots and verifier, nine SQL migrations, two live SQL regressions, the encrypted local backup and application unit tests. The initial repository worktree was clean.

Current references used: [Supabase function security](https://supabase.com/docs/guides/database/functions), [RLS and policy performance](https://supabase.com/docs/guides/database/postgres/row-level-security), [database advisors and remediation](https://supabase.com/docs/guides/database/database-linter), and [Supabase changelog](https://supabase.com/changelog). These explain the remediation patterns; project-specific conclusions come from the live inspection and tests.

Dependency follow-up: scoped `@typescript-eslint/typescript-estree` → minimatch 11.0.8 override in npm and Bun locks; `npm audit` and frozen Bun install passed. The compatibility test exercises the actual parser project service. See [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).

All nine SQL hashes match the production ledger after newline/trailing-whitespace normalization. Machine-readable verification: `security/database-audit-verification.json`. The Node 22 production build passed, including prebuild and postbuild checks. Non-fatal existing warnings remain for TanStack inputValidator deprecations, Vite configuration and large/slow bundles.
