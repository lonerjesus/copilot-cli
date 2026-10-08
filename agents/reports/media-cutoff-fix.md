# Media cutoff fix

## Symptom
Uploaded song cuts off early during playback.

## Root cause
`/api/media` returned only full `200` responses with **no `Accept-Ranges` / `206`**. Safari and Chromium progressive AV stop once the initial buffer ends when Range is unsupported. Incomplete KV reassembly could also return trailing NULs (silent early end).

## Fix
- HTTP Range + HEAD on `/api/media` (`206` / `416` / `Accept-Ranges: bytes`)
- KV get fails closed if reassembled bytes ≠ declared size
- Native player: `preload="auto"`, timeupdate ↔ scrub sync
- `qa:media-range` E2E: full-byte match + Range across chunk boundary (~9 MB WAV)

## Verify
media-range **30/30** · edit-save 15 · av-e2e 14 · smoke 60 · build:next green
