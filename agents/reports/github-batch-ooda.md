# GitHub OODA — batch album/series (#41)

**Date:** 2026-10-11  
**PR:** https://github.com/lonerjesus/copilot-cli/pull/41  
**Branch:** `cursor/batch-album-series-05af`

## OBSERVE (GitHub)

| PR | State | Touch | Signal |
|----|-------|-------|--------|
| [#38](https://github.com/lonerjesus/copilot-cli/pull/38) | MERGED | AdminStation, media-store, middleware | Worker OOM on chunk assemble — **do not unzip server-side** |
| [#28](https://github.com/lonerjesus/copilot-cli/pull/28) | MERGED | chunked 512MB uploads | Batch reuses this path |
| [#31](https://github.com/lonerjesus/copilot-cli/pull/31) | MERGED | AV MIME variants | Batch validate/filter uses same allowlist |
| [#40](https://github.com/lonerjesus/copilot-cli/pull/40) | OPEN DRAFT | StreamDeck, globals.css, player, reports | **Conflict:** both edit `StreamDeck.tsx` (CONTINUE vs collection rails) |
| [#39](https://github.com/lonerjesus/copilot-cli/pull/39) | OPEN DRAFT | player AV-only | No AdminStation overlap |
| [#36](https://github.com/lonerjesus/copilot-cli/pull/36) | OPEN DRAFT | player art | No AdminStation overlap |
| Workers Builds | On #40 SUCCESS | Cloudflare Pages/Workers | Same check expected on #41 |

No GitHub Actions workflows in-repo (404 on `.github/workflows`) — CI is **Workers Builds: kamaunegasi-net**.

## ORIENT

- Batch ZIP must stay **browser-only** (redteam from #38).
- `#40` CONTINUE shelf and `#41` collection shelves both prepend rails in `StreamDeck` — merge will need a manual combine (CONTINUE block + `groupByCollection` block).
- Do **not** half-port CONTINUE into #41 without `playback-memory.ts` (would break build).

## DECIDE (merge order)

**Preferred:** merge **#41** (batch) → rebase **#40** onto main → keep both CONTINUE and collection rails in StreamDeck.

Alternate: merge #40 first, then rebase #41 the same way.

## ACT

- #41 opened with evidence + tests green locally
- CI subscribed on `cursor/batch-album-series-05af`
- Conflict called out in PR body; no silent StreamDeck half-merge

## REDTEAM

| Risk | Status |
|------|--------|
| Merge wipe of CONTINUE or collections | Called out; rebase must keep both |
| Agent report files collide (`names-audit.md` etc.) | Both PRs rewrite reports — last merge wins prose; code is source of truth |
| Workers Builds fail on OpenNext | Watch CI subscription |
