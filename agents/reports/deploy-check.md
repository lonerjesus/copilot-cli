# deploy-check

**Agent:** cloudflare-deploy  
**Verdict:** PASS

- `wrangler.toml`: name `kamaunegasi-net`, compatibility_date `2025-10-01`.
- Vars: `SITE_DOMAIN=www.kamaunegasi.net`, `EXACT_NAME_POLICY=1`, `AGE_GATE_REQUIRED=1`.
- Build: `npm run build` (Node ≥22).
- Domain already on Cloudflare; Pages Next adapter noted in README for edge API routes.
