# security-report — production-ready harden

**Verdict:** PASS (with residual notes)

### Fixed this tip
- Single-shot admin media rejects `> SINGLE_SHOT_MAX_BYTES` (413) before isolate OOM
- ZIP unpack budgets **actual** inflated bytes; 512 MiB archive cap in admin tab
- Chunked complete durability = part keys present (not raced `received[]`)
- Age gate SSR does not claim confirmed

### Residual (non-blocking)
- Register with configured `ADMIN_EMAIL` remains bootstrap admin path (ops)
- Auth / upload rate limits are isolate-local
- Upload sessions lack TTL
- CSP still allows `script-src 'unsafe-inline'` (Next/OpenNext constraint)

No new deps. Collection type enum fail-closed. Media Session artwork from existing posters / brand logo.
