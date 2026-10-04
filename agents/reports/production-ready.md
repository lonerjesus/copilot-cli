# production-ready check — 2026-10-04

## Verdict

| Layer | Status |
|-------|--------|
| **Code / build** | **READY** |
| **Cloudflare deploy command path** | **READY** |
| **Live traffic (accounts/purchases)** | **NOT READY** until ops below |

## Verified just now

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS (earlier this session) |
| `eslint` | PASS |
| `npm run build:next` | PASS |
| `npm run build` (OpenNext) | PASS → `.open-next/worker.js` |
| `wrangler deploy --dry-run` | PASS (5563 KiB worker + assets) |
| `qa-smoke` (21 vectors) | **21/21 PASS** |
| Account gate / bot 403 / paywall 402 / webhook 503 | PASS |
| Exact names 357Itsumi + Streetpolitik | PASS |

## Dashboard settings (correct)

- Build: `npm run build`
- Deploy: `npx wrangler deploy`

## Blockers before live traffic

1. **AUTH_SECRET** — required in production (≥16 chars)  
   `npx wrangler secret put AUTH_SECRET`
2. **AUTH_KV** — still commented out in `wrangler.toml`  
   Without it, Workers registration/login returns **503** (fail-closed, by design).  
   ```bash
   npx wrangler kv namespace create AUTH_KV
   # uncomment [[kv_namespaces]] AUTH_KV in wrangler.toml with the id
   # redeploy
   ```
3. Optional Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (demo payments only until set)
4. Custom domain `www.kamaunegasi.net` attached

## Non-blocking WARNs

- Rate limits are per-isolate (in-memory)
- OpenNext incremental cache still dummy (no R2/KV cache)
- `compatibility_date = 2025-10-01` could be bumped later
