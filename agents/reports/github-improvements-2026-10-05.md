# GitHub list → improvements — 2026-10-05

Sources: PRs #1–#6 (issues disabled), Cloudflare preview bot comments, prior squad reports.

## Taken from GitHub / reports

| Item | Source | Action |
|------|--------|--------|
| CF Preview Builds fail on PR branches | PR #6 bot + checks | Documented; `preview_id` stub in `wrangler.toml` |
| Pin Stripe return URLs | security-report WARN | `checkoutOrigin()` prefers `SITE_URL` / `SITE.domain` |
| `ACCOUNT_GATE` / `AGE_GATE_REQUIRED` unused | audit-followup | Wired in middleware + `data-age-gate` |
| Preserve `?next=` after access when already authed | prior audit | Middleware honors safe `next` |
| Expand smoke for rack / floppy / catalog | PR #6 test plan | `qa-smoke.sh` → **38/38 PASS** |
| Admin publish path | PR #6 | Smoke with `ADMIN_EMAIL` passes |
| AUTH_SECRET / ADMIN_EMAIL ops | PR #5 go-live | Remains ops (not code) |

## Test

```
ADMIN_EMAIL=owner@… bash scripts/qa-smoke.sh http://localhost:3020
→ 38 passed · 0 failed
```

## Still ops-only
- Create KV `preview_id` for Preview Builds
- Set `ADMIN_EMAIL` + `AUTH_SECRET` in Cloudflare production
- Merge to `main` for green Workers Builds production check
