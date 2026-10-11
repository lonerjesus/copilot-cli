# Production-ready harden — OODA

**Branch:** `cursor/prod-ready-harden-05af`  
**Base:** `main` @ `#45` + `#46` (Workers Builds already green)

## OBSERVE
Live `main` had landing ▶ + large AV, but still lacked elite player (resume / Media Session / CONTINUE / volume), DeckArt, AV-only dock, batch ZIP albums/series.

## ORIENT
Ship one tip that merges stack product surfaces onto `main` without regressing #45/#46 upload/landing paths.

## ACT
- Elite PlayerContext + PlayerDock (DeckArt, resume, Media Session, volume, AV-only)
- StreamDeck CONTINUE + collection shelves + newest-first seed
- Admin batch ZIP + large parallel chunk upload (1.5 GiB)
- Boot finish cannot be blocked by analytics
- CSP: `unsafe-eval` **dev-only**; production stays tight
- Unified qa-gate (queue · playable-house · large-av · player-av · playback-memory · collection-zip)

## REDTEAM
- Close superseded conflicting drafts after this merges (#36/#39/#40/#42/#44/#47)
- Optional MEDIA_R2 still recommended for multi‑GB later

## Verdict
MERGE_OK pending tip CI
