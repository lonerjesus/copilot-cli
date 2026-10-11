# Hero play → idle DECK — OODA fix

**Branch:** `cursor/hero-play-handoff-05af`  
**Domain:** www.kamaunegasi.net

## OBSERVE
Landing ▶ called `setExpanded(true)` + `toggle()` with an empty player queue (`CATALOG` seed is `[]`; live catalog never seeded the dock). UI showed **DECK** / **NO SIGNAL**; real play only after clicking a tile.

## ORIENT
Bounce-critical: first CTA must start house AV. Same failure on idle dock ▶.

## DECIDE / ACT
- `enterStream` + `seedQueue` + `playItem(..., { forcePlay })` in PlayerContext
- Hero + idle dock fetch `/api/catalog` and start first playable (`forcePlay: true`)
- StreamDeck soft-seeds empty queue when live catalog arrives
- `qa:hero-play` — 7/7

## REDTEAM
Empty catalog still opens idle DECK (correct — nothing to play). forcePlay overrides “tap” autoplay for explicit CTAs only.
