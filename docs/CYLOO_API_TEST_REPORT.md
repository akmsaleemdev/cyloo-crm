# CYLOO CRM — Backend & API Verification Report

**Audit Date:** November 2026  
**Platform Version:** 6.8.9  
**Protocol Scope:** REST Endpoints, OpenAPI Contracts, Webhook Intakes, and Nitro Server Functions  

---

## 1. Executive Summary

This report documents the verification of API endpoints, webhook intake routers, and server-side functions in CYLOO CRM.

### Verification Summary:
- **Server Functions:** All internal client-to-server calls utilize TanStack Start `createServerFn()` with strict Zod input validation schemas.
- **Webhook Intakes:** Webhooks from Meta (WhatsApp Cloud API) and TikTok enforce mandatory cryptographic signature verification (HMAC-SHA256).
- **Public Embedding Endpoints:** Chat widgets and lead forms implement rate-limiting headers and bot-resistant anti-spam token verification.
- **Error Handling:** Unhandled exceptions are intercepted at the Nitro edge router layer, returning structured JSON error payloads without stack trace leakage.

---

## 2. API Contract & Endpoint Verification Matrix

| Endpoint Route | Method | Authentication & Scopes | Payload Validation | Concurrency & Idempotency | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| `/api/public/hooks/whatsapp` | `POST` | Meta Signature (`X-Hub-Signature-256`) | Meta Graph Webhook Schema | Idempotent message deduplication | ✅ PASS |
| `/api/public/hooks/tiktok` | `POST` | TikTok Signature (`X-Tiktok-Signature`) | TikTok Event Payload | Idempotent event ID tracking | ✅ PASS |
| `/api/public/hooks/cron` | `POST` | Bearer Token (`CYLOO_CRON_TOKEN`) | Constant-time token match | Scheduled task lock check | ✅ PASS |
| `/api/public/widget/config/$id`| `GET` | Widget Public Token | UUID validation | Edge cached via Cloudflare CDN | ✅ PASS |
| `createServerFn:contacts.create`| `POST` | JWT Bearer (`workspace_id`) | Zod `ContactInputSchema` | Transactional rollback on error | ✅ PASS |
| `createServerFn:deals.update` | `POST` | JWT Bearer (`deals:write`) | Zod `DealUpdateSchema` | Optimistic locking on version | ✅ PASS |
| `createServerFn:ai.stream` | `POST` | JWT Bearer (`ai:execute`) | Zod `AiStreamInputSchema` | Token budget metering check | ✅ PASS |
| `createServerFn:clm.sign` | `POST` | JWT Bearer (`contracts:sign`) | Cryptographic Hash Stamp | Irreversible signed timestamp lock | ✅ PASS |
| `createServerFn:zatca.verify` | `POST` | JWT Bearer (`finance:write`) | ZATCA Phase 2 TLV Schema | Sequential invoice hash check | ✅ PASS |

---

## 3. Cryptographic Webhook Validation Details

### Meta WhatsApp Cloud API HMAC Check
```typescript
// Verified Inbound Signature Guard
const signature = request.headers.get("x-hub-signature-256");
const expectedSignature = `sha256=${crypto
  .createHmac("sha256", APP_SECRET)
  .update(rawBody)
  .digest("hex")}`;

if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
  return new Response("Invalid signature", { status: 403 });
}
```

---

## 4. API Rate Limiting & Protection

- **Edge DDoS & Rate Limiting:** Enforced via Cloudflare Workers Edge Rules (1,000 requests / minute per client IP on public endpoints).
- **Supabase API Throttling:** Enforced on auth endpoints to prevent brute-force credential stuffing.
- **Anti-Spam Form Protection:** Public lead forms utilize cryptographic challenge tokens verified server-side before persisting new contact records.

