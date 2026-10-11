# E2E verify — requested player + large AV

**Date:** 2026-10-11  
**Tip tested:** `cursor/e2e-verify-requested-05af` = `main` + #45 + #46 (+ boot harden)  
**Runtime:** `next start` :3040 (prod bundle — `next dev` CSP blocks React eval in Playwright)

## OBSERVE — production www

| Item | Status |
|------|--------|
| `main` tip | still `#43` only |
| #45 landing ▶ | OPEN, CI green — **not merged** |
| #46 large AV | OPEN, CI green — **not merged** |
| Live site | still Pause+NO SIGNAL / old upload path |

## ACT — local prod-mode e2e

| Suite | Result |
|-------|--------|
| `qa:av-e2e` | **18/18 PASS** |
| `qa:edit-save` | **15/15 PASS** |
| `qa:media-range` | **34/34 PASS** |
| `qa:hero-play` | **core PASS** — not NO SIGNAL, playing; latest AV |
| 9 MB chunked probe | **PASS** (3×3 MiB → Range 206) |
| units (large-av / playable-house / queue) | **PASS** |
| Artifact | `hero-play-handoff.png` — Track playing, UP NEXT filled |

## REDTEAM

- Playwright vs `next dev` false-negatives (CSP lacks `unsafe-eval`).
- Auth rate-limit noise after heavy suites.
- **Not live on www until #45+#46 merge/deploy.**

## Verdict

**Fixes verified in prod-mode e2e. Production still needs merge.**
