# production-ready check — 2026-10-05

Commit under test (main): `635fba8` (merge of PR #6)  
Probe / fix branch: `cursor/prod-ready-verdict-560e`

## Verdict

| Layer | Status |
|-------|--------|
| **Code / OpenNext build** | **READY** |
| **Workers Builds (main → worker script)** | **READY** (Version `102e32d2-…` success) |
| **Worker config bindings (`AUTH_KV`, gates)** | **READY** |
| **Local prod smoke (38 vectors)** | **READY** (38/38) |
| **Live custom domain** | **NOT READY — BLOCKER** |
| **Ops secrets (`AUTH_SECRET`, `ADMIN_EMAIL`)** | **UNVERIFIED** (no Wrangler API token here) |

**Overall:** Application code is deployable and locally green. **Live `www.kamaunegasi.net` is not production-ready** — after Cloudflare challenge clears, the hostname returns HTTP **404** Workers placeholder *“There is nothing here yet / Powered by Cloudflare”* (not the Access gate). Worker Builds succeeded, so the gap is **domain → worker routing**, not the OpenNext bundle.

This branch adds `routes` custom domains + `workers_dev = true` in `wrangler.toml` so the next production deploy attaches apex/`www` to `kamaunegasi-net`.

## Verified this pass

| Check | Result |
|-------|--------|
| `npm run build` (OpenNext → `.open-next/worker.js`) | PASS |
| `npx wrangler deploy --dry-run` | PASS — ~5714 KiB; bindings include `AUTH_KV` + gate vars |
| `tsc --noEmit` | PASS |
| `qa-smoke` @ `:3040` with `ADMIN_EMAIL` | **38/38 PASS** |
| Workers Builds on `635fba8` | **success** |
| Live `curl` (agent UA) | **403** `cf-mitigated: challenge` |
| Live Chrome (CDP, post-challenge) | **404** CF empty placeholder on `/` and `/access` |
| `*.workers.dev` probe | NXDOMAIN (subdomain not usable until `workers_dev` publish) |
| `npx wrangler secret list` | FAIL — unauthenticated |

### Evidence artifacts

- `/opt/cursor/artifacts/screenshots/live-www-probe.png` — empty CF placeholder
- `/opt/cursor/artifacts/production_readiness.txt` — summary
- Local access gate (for comparison): `/opt/cursor/artifacts/access_gate.webp`

## Smoke coverage that passed (local)

Account gate, register/login, bot 403, feed/ingest/catalog auth, paywall 402 / owned download, fetched free download, webhook fail-closed 503, donate demo, robots disallow-all, 18+ marker, drive rack + browse bay + age-gate, footprint floppy + `/#browse`, admin forbid/ok/publish, exact names **357Itsumi** + **Streetpolitik**.

## Ops checklist (human / dashboard)

1. **Merge this branch → `main`** so Workers Builds redeploys with custom domain routes.
2. Confirm dashboards: `www.kamaunegasi.net` + `kamaunegasi.net` listed under Worker **Custom Domains** for `kamaunegasi-net`.
3. **AUTH_SECRET** — Workers secret ≥16 chars.
4. **ADMIN_EMAIL** (or `ADMIN_EMAILS`) — so `/admin` publish works.
5. Optional: isolate Preview KV (`wrangler kv namespace create AUTH_KV --preview`) — `preview_id` currently equals production id so PR Builds can green.
6. Re-check live browser: expect `/` → `/access` gate (not CF empty page).

## Non-blocking WARNs

- Rate limits per-isolate (in-memory).
- OpenNext incremental cache still dummy.
- `compatibility_date = 2025-10-01`.
- Local `eslint`: 9 errors / 1 warning (`no-html-link-for-pages`, `set-state-in-effect`) — does not block OpenNext/smoke.

## Definition of done

| Goal | Met? |
|------|------|
| Mergeable / buildable code | Yes |
| Production Workers Build green on main | Yes (script) |
| `AUTH_KV` in worker config | Yes |
| Live domain serves app | **No — blocker; fix in this PR’s wrangler routes** |
| Secrets confirmed | No — verify manually after domain works |
