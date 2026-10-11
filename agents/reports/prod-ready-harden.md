# Production-ready harden — OODA

**Branch:** `cursor/prod-ready-harden-05af`  
**Base:** `main` @ `#45` + `#46` (Workers Builds already green)

## OBSERVE
Live `main` had landing ▶ + large AV, but still lacked elite player (resume / Media Session / CONTINUE / volume), DeckArt, AV-only dock, batch ZIP albums/series.

## ORIENT
Ship one tip that merges stack product surfaces onto `main` without regressing #45/#46 upload/landing paths. Redteam before merge found parallel-chunk and false-playing gaps.

## ACT
- Elite PlayerContext + PlayerDock (DeckArt, resume, Media Session, volume, AV-only)
- StreamDeck CONTINUE + collection shelves + newest-first seed
- Admin batch ZIP + large parallel chunk upload (1.5 GiB)
- Boot finish cannot be blocked by analytics
- CSP: `unsafe-eval` **dev-only**; production stays tight
- Unified qa-gate (queue · playable-house · large-av · player-av · playback-memory · collection-zip)

### Redteam harden (pre-merge)
- **Chunk complete** probes durable part keys (ignores raced `meta.received`)
- **`play()` reject** resets dock to honest ▶ (`onPlayBlocked` → pause)
- **Age gate** SSR snapshot `false` (no stream flash before confirm)
- **ZIP** 512 MiB admin RAM cap; budget on inflated bytes (ZIP-bomb)
- **Single-shot** `/api/admin/media` enforces `SINGLE_SHOT_MAX_BYTES`
- **enterStream** fetch uses `AbortController` (hero + idle dock)
- R2 complete `head()` size check when available

## REDTEAM residual (follow-up OK)
- Batch publish not transactional (partial albums on mid-loop fail)
- Auth rate limits isolate-local; upload session TTL
- Optional MEDIA_R2 still recommended for multi‑GB later
- Admin bootstrap via `ADMIN_EMAIL` register is intentional ops path

## Verdict
MERGE_OK pending tip CI after harden commit
