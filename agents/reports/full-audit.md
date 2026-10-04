# Full audit — 2026-10-04

Scope: entire repo after OpenNext merge + auth/paywall. Waves: security ∥ catalog-names ∥ cloudflare-deploy → verifier.

## Wave summary

| Agent | Verdict |
|-------|---------|
| security | PASS (after AUTH_KV fail-closed fix) |
| catalog-names | PASS (tag/blurb drift cleaned) |
| cloudflare-deploy | PASS (OpenNext build path); OPS: AUTH_SECRET + AUTH_KV required go-live |
| commerce/paywall | PASS |
| verifier | MERGE_OK for code; go-live checklist remaining |

## Fixed in this audit branch

1. **Auth store** — Workers no longer silently use memory. Priority: `AUTH_KV` → FS → memory only in non-production / `ALLOW_MEMORY_AUTH=1`. Production without KV throws `AuthStoreUnavailableError` (API → 503).
2. **Catalog exact-name** — GrownAssKids / GRUNGEzhou tags & blurbs use canonical spellings only.
3. **AppShell** — removed optimistic `markOwned` on `?purchased=`; refresh from server only.
4. **ESLint** — ignore `.open-next/**` / `.wrangler/**`.
5. **Docs** — README Workers/OpenNext build commands + AUTH_KV setup; `.env.example` memory flag note.

## Go-live checklist (ops, not code)

- [ ] `wrangler secret put AUTH_SECRET`
- [ ] `wrangler kv namespace create AUTH_KV` → uncomment binding in `wrangler.toml` → redeploy
- [ ] Optional Stripe secrets
- [ ] Cloudflare Build = `npm run build`, Deploy = `npx wrangler deploy`
- [ ] Confirm custom domain `www.kamaunegasi.net`

## Residual WARNs (non-blocking)

- In-memory rate limits (per-isolate on Workers)
- Header sets duplicated across middleware / next.config / `_headers`
- Webhook uses shared header secret (not Stripe body signature)
- OpenNext compatibility_date 2025-10-01 (upgrade when ready)
- Default OpenNext caches are dummy (no R2/KV incremental cache)
- YouTube hosts allowlisted in oembed/CSP without catalog YouTube URLs
- `SaveGuard` is client friction only (server download gate is authoritative)
- `agents/reports/*` and `squad.json` ponytail YAGNI candidates

## Verifier

`MERGE_OK` — no open FAIL/BLOCKER in code. Production durability depends on AUTH_KV + AUTH_SECRET ops steps above.
