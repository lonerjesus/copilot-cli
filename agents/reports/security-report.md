# security-report — 2026-10-04 full audit

**Agent:** security  
**Verdict:** PASS (code) · OPS remaining

### PASS
- Account gate (`middleware.ts` + `PUBLIC_PATHS`)
- Session HMAC Web Crypto parity (`token.ts`)
- Bot UA deny + rate limit + honeypot + `safeInternalPath`
- Download 402 until owned; webhook fail-closed without secret
- Cookie flags httpOnly / SameSite=Lax / secure in production
- CSP + X-Robots-Tag noindex; robots disallow-all
- Auth store fail-closed without AUTH_KV/FS in production (`store.ts`)
- `/api/ingest` read-only GET; `/api/oembed` host allowlist
- Analytics first-party `localStorage` only

### WARN
- Rate-limit Map is per-isolate on Workers
- Shared webhook header secret (not Stripe signature)
- Bot UA spoofable (session remains real gate)

### OPS (required before production traffic)
- Bind `AUTH_KV` in `wrangler.toml` after `wrangler kv namespace create AUTH_KV`
- `wrangler secret put AUTH_SECRET` (≥16 chars)
