# Guest user E2E (production)

**Role:** anonymous visitor + non-admin member (**never owner**)  
**Server:** `next start` :3035 (build @ `524c29d`)  
**Script:** `scripts/e2e-guest-user.mjs`  
**Result:** **27/27 PASS**

## Anonymous visitor
| Check | Result |
|-------|--------|
| Lands on `/access` | PASS |
| Account required / sign in / create account | PASS |
| No admin link, no MagCloud | PASS |
| Privacy + Terms | PASS |
| Catalog API blocked | PASS |
| Admin has no compose | PASS |

## Guest member (non-admin)
| Check | Result |
|-------|--------|
| Register / enter shell | PASS |
| No admin nav | PASS |
| Stream loads | PASS |
| Player dock visible + fixed on scroll | PASS |
| Browse loads; click opens content | PASS |
| Writing opens without MagCloud | PASS |
| House atlas (no compose) | PASS |
| Support view | PASS |
| Autoplay control visible | PASS |
| `/admin` unusable | PASS |
| No page JS errors | PASS |

## Artifacts
`/opt/cursor/artifacts/guest-e2e/` — `01`…`07` screenshots + `results.txt`
