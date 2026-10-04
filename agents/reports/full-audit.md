# full-audit

**Agent:** verifier + security + catalog-names + qa-browser  
**Date:** 2026-10-04  
**Branch:** `cursor/auth-paywall-donations-560e`  
**Verdict:** MERGE_OK (with production follow-ups noted)

## Fixed this pass

| ID | Finding | Status |
|----|---------|--------|
| B1 | Webhook unauthenticated grants | Fixed — requires `STRIPE_WEBHOOK_SECRET` via `x-kn-webhook-secret`; else 503 |
| B2 | Production demo free-grants | Fixed — demo only when `ALLOW_DEMO_PAYMENTS=1` or non-production; removed from wrangler vars |
| H1 | AccessGate open redirect (`//evil`) | Fixed — `safeInternalPath` |
| H2 | Weak webhook signature | Fixed — shared-secret equality only; no body grants without secret |
| H4 | Optimistic `markOwned` before Stripe | Fixed — demo refreshes from server; Stripe waits for settlement |
| H5 | `/api/*` public cache in `_headers` | Fixed — `private, no-store` |
| M2 | Unbounded password | Fixed — max 128 |
| M3 | Unbounded donation | Fixed — max $1,000 |
| M4 | `/api/auth/*` blanket public | Fixed — explicit path allowlist |
| Names | Kamau "357Itsumi" Negasi / STPK hint / bandcamp-30over9 platform | Fixed |
| Web URLs | brand stubs → `kamaunegasi.me` | Fixed |

## Remaining production follow-ups (not blockers for this PR)

| ID | Item | Note |
|----|------|------|
| B3 | Durable auth store | `.data/` JSON is Node-local; migrate to D1/KV before Cloudflare production accounts |
| H3 | Catalog in client JS | Account gate blocks HTML/API; JS chunks still contain catalog copy by design for stream UX |
| M1 | Distributed rate limits | In-memory per isolate; prefer Cloudflare WAF/rate limiting at the edge |
| Content | Some TSOL/Vimeo/MagCloud rows use platform-root URLs | Exact deep links need house source URLs when available |

## Verification

- lint: PASS
- tsc: PASS  
- qa-smoke: expected 21/21 including webhook-fail-closed
- exact-name forbidden scan: PASS
- robots disallow-all + account gate: PASS
