# qa-browser.md

**Agent:** `qa-browser`  
**Verdict:** `PASS`

## Path matrix

| Path | Result |
|------|--------|
| Unauth `/` → `/access` | PASS |
| Register → authed home | PASS |
| House stream (no Names; MagCloud Featured) | PASS |
| Footprint outside media | PASS |
| Session exclusivity (2nd login kicks 1st) | PASS |
| Catalog auth + house API | PASS |
| Paywall / fetched download | PASS |
| `tsc` + `build:next` + smoke 52/52 | PASS |

Automated: `scripts/qa-smoke.sh` @ http://127.0.0.1:3000 — **52 passed · 0 failed**
