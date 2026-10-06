# a11y-report

**Agent:** `a11y`  
**Branch:** `cursor/netflix-house-stream-560e` vs `origin/main`  
**Surfaces:** AppShell · StreamDeck · AdminStation · Hero · CommandBar · AuthContext kick · CategoryBrowser  
**Verdict:** FAIL

## WCAG-oriented findings

### BLOCKER / high

| ID | Issue | Where | Fix |
|----|-------|-------|-----|
| A1 | Accessible name `F:` no longer matches drive map; SR/users hear wrong letter | `Hero.tsx` secondary Link | Label `E:` (or `E: FOOTPRINT`) to match AppShell drive E |
| A2 | Tile action `mag` has no explicit accessible name beyond cryptic text | `StreamDeck` Tile | `aria-label="Open magazine"` (keep visible `mag` if desired) |
| A3 | `+ next` relies on `title` only; incomplete for some AT | `StreamDeck` Tile | Add `aria-label="Play next"` (keep `title` optional) |
| A4 | Featured play control is a large button without an explicit play name when poster is decorative | `StreamDeck` featured card | `aria-label={`Play ${hero.title}`}` or include visible “play” in accessible name |
| A5 | Auth kick: silent `router.replace("/access")` with no live announcement | `AuthContext.tsx` | Before redirect, set `role="status"` / `aria-live` message (“Session ended — sign in again”) or land on `/access?reason=session` with visible copy |

### Medium

| ID | Issue | Where | Fix |
|----|-------|-------|-----|
| A6 | `ShelfTrack` is `tabIndex={0}` + `role="list"`; ArrowLeft/Right scroll the track but do not move focus between `listitem`s | `StreamDeck` | Prefer roving tabindex on tiles, or document that arrows scroll only and Tab reaches each tile button |
| A7 | Admin preset buttons use `is-active` class only — no `aria-pressed` | `AdminStation` presets | `aria-pressed={preset === p.id}` |
| A8 | Hero primary becomes glyph-only `▶` while playing | `Hero.tsx` | Keep text + glyph (`pause` / `playing`) so name stays clear |
| A9 | Command chip `⏭` may announce poorly | `CommandBar` | Ensure `title`/`aria-label` is `next` (title already `c.cmd` — verify SR reads “next” not emoji) |

### Low / notes

| ID | Note |
|----|------|
| A10 | DriveBay face buttons retain `aria-expanded` + `aria-controls` — good after bay remap |
| A11 | Admin form labels wrap inputs; preset group has `aria-label="Upload type"` — PASS |
| A12 | CategoryBrowser house-only filter does not remove existing control labels |
| A13 | Empty genre shelves return `null` — no empty-state announcement when house has essays but no video/audio/still (see UX) |
| A14 | Global `:focus-visible` phosphor outline from prior work still applies — do not regress |

## Keyboard paths touched

| Path | Status |
|------|--------|
| `/` focus → CommandBar chips → bay open | PASS (structure) |
| Shelf ArrowLeft/Right scroll | PARTIAL (A6) |
| Tile Enter/Space play | PASS (native button) |
| Featured Enter/Space | PASS (button) |
| Session loss → `/access` | FAIL announcement (A5) |

## Exact-name policy

No a11y copy invents third-party names. Visible titles remain catalog strings (**Streetpolitik**, **QUARANTINED THOUGHTS OF A STREET STATISTIC**, **Telling Show Of Love** default in admin).

## Must-fix

1. Hero Footprint label → `E:` (A1).
2. `aria-label` on `mag` / `+ next` / featured play (A2–A4).
3. Auth kick live region or `/access` reason copy (A5).
4. Admin preset `aria-pressed` (A7).

**FAIL**
