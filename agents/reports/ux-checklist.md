# ux-checklist

**Agent:** `ux`  
**Branch:** `cursor/netflix-house-stream-560e` vs `origin/main`  
**Surfaces:** AppShell · StreamDeck · AdminStation · Hero · CommandBar · AuthContext kick · CategoryBrowser  
**Verdict:** FAIL

## Composition

| Check | Result | Notes |
|-------|--------|-------|
| Brand-first hero (`SITE.title` = KAMAU NEGASI) | PASS | Hero still leads with brand; tagline unchanged |
| One job per section / no Names clutter | PASS | `AliasMatrix` + Names bay removed; rack is stream → browse → chart → support → footprint |
| Netflix shelves read as one stream surface | FAIL | Seed house catalog = **2 essays only** (`QUARANTINED THOUGHTS OF A STREET STATISTIC` VOL. 1–2 under **Streetpolitik**). VIDEOS / MUSIC / PHOTOS shelves render `null` — Netflix pattern promised, genre rows missing |
| Hero budget (brand · one line · CTA) | PASS | Commerce line updated; no new cards/stat strips |
| Motion / atmosphere | PASS | Existing hero atmosphere retained; shelf scroll is purposeful |

## CTA clarity

| CTA | Result | Notes |
|-----|--------|-------|
| Hero primary `stream` | FAIL | Plays `getQueue()` → chapbook essays with no native `src` / embed. Featured copy says “press play · queue follows” but play path is dock + magazine, not stream media |
| Hero secondary `F:` | FAIL | **Drive letter stale.** AppShell / CommandBar map Footprint to **E:**; Hero still labels **F:**. Mental model broken after Names removal remapped D/E |
| Playing state label `▶` only | WARN | Loses “stream” word when already playing — weak affordance |
| Command chips A–E + play/next/queue | PASS | Hints match remapped bays (support D, footprint E); `next` / `queue` wired |
| Featured card | WARN | Good hierarchy; CTA text overpromises playability for MagCloud essays |
| Admin Video / Photo / Music presets | PASS | Clear one-job upload path; publish button names preset |

## Drive letters (post–Names removal)

| Bay | Drive | Consistent? |
|-----|-------|--------------|
| STREAM | A | yes |
| BROWSE | B | yes |
| CHART | C | yes |
| SUPPORT | D (was E) | CommandBar yes; Hero N/A |
| FOOTPRINT | E (was F) | AppShell + CommandBar yes; **Hero `F:` FAIL**; FootprintArchive title still `F: FOOTPRINT` |

## CategoryBrowser house-only

- PASS for product intent: `houseCatalog()` filters outside/fetched off member browse.
- WARN: thinner grid until admin uploads land — acceptable if empty-state copy is honest (browse still uses live seed).

## AuthContext kick

- Out of scope for visual composition; session kick is abrupt (no in-UI reason). Deferred to `analytics-bounce` / `a11y`.

## Exact-name spot check (touched UI)

- Hero / stream use catalog brands as stored: **Streetpolitik**, **QUARANTINED THOUGHTS OF A STREET STATISTIC** — no third-party renames in this diff.
- Admin default brand remains **Telling Show Of Love**.

## Must-fix (blocks polish PASS)

1. Change Hero Footprint control from `F:` → `E:` (and align FootprintArchive page title to `E:`).
2. Do not ship Netflix shelves that silently omit VIDEOS / MUSIC / PHOTOS: either seed ≥1 house item per shelf **or** show intentional empty shelves with a single line (“upload from ADMIN”) — not a two-row essay-only “stream.”
3. Retarget Hero / Featured play CTA for essay-only seed: open magazine when `hasMagazine`, or change copy to “read · open stream” so “stream” is not a dead play promise.

## Residual (non-blocking if 1–3 fixed)

- Names bay gone is correct for house-stream focus; brand discovery remains via tile `brand` + CategoryBrowser filter.
- Admin presets are production-ready UX.

**FAIL**
