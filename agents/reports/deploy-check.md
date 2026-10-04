# deploy-check — 2026-10-04 full audit

## Verdict: PASS (build path) · OPS for secrets/KV

### PASS
- `npm run build` → `opennextjs-cloudflare build`
- `open-next.config.ts` `buildCommand: "npx next build"` (no recursion)
- `wrangler.toml` `main=.open-next/worker.js`, assets `.open-next/assets`, `nodejs_compat`
- Local OpenNext build produces worker.js

### Dashboard
- Build: `npm run build`
- Deploy: `npx wrangler deploy`

### OPS
1. Create AUTH_KV, uncomment `[[kv_namespaces]]` in wrangler.toml
2. Set AUTH_SECRET (and Stripe if used)
3. Domain: www.kamaunegasi.net

### WARN
- `compatibility_date = "2025-10-01"` — consider bumping
- Incremental cache still dummy (no R2/KV cache binding)
