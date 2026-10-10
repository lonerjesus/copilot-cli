# E2E site check — 2026-10-10

## Verdict

| Surface | Status | Notes |
|---------|--------|-------|
| Local branch (`cursor/team-review-fixes-560e`) | **PASS** | `qa-smoke` 67/67; guest E2E 27/27 after CTA assertion update |
| PR Preview Workers | **AUTH BROKEN** | Register returns `AUTH_SECRET must be set (≥16 chars) in production` |
| Production `https://www.kamaunegasi.net` | **Bot Fight challenge** for automated clients (`cf-mitigated: challenge`) | Real browsers may pass; HTTPS not fully probeable from CI |
| Production `http://www.kamaunegasi.net` | **PASS (auth works)** | Register succeeded; serves **pre-PR** build (old CSP, `s-maxage=31536000` on `/access`) |

## Root causes (why it “isn’t working”)

1. **PR Preview has no `AUTH_SECRET`** — Preview Deployments do not inherit production secrets. Sign-up / sign-in on  
   `https://cursor-team-review-fixes-560e-kamaunegasi-net.sbjzms7z4t.workers.dev` fails until Preview secrets include `AUTH_SECRET`.
2. **Production HTTPS** is fronted by Cloudflare Bot Fight (“Just a moment…”). Curl/bot UAs get 403; this can look like a dead site from some networks/tools.
3. **PR #37 is not merged** — production still runs the previous deploy (no Insights CSP, `/access` still year-cacheable over HTTP).

## Local E2E (this branch)

```
qa-smoke @ :3080     → 67 passed · 0 failed
guest E2E @ :3080    → 27 passed · 0 failed
```

Guest artifacts: `/opt/cursor/artifacts/guest-e2e-audit/`

## Ops fixes (not code)

1. Cloudflare Dashboard → Worker `kamaunegasi-net` → **Variables and Secrets** → add `AUTH_SECRET` for **Preview** (and confirm Production).
2. Turn on **Always Use HTTPS**; review **Bot Fight Mode** if real users hang on the challenge.
3. Merge/deploy PR #37 for the review fixes to reach production.

## Code follow-ups in this check

- Updated `e2e-guest-user.mjs` / `qa-smoke.sh` / `e2e-platform-compare.mjs` for unified **Enter Stream** CTAs.
- README: Preview must set `AUTH_SECRET`; Bot Fight note.
