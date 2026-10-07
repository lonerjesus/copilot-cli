# upscale-polish — icon chrome + compose/stream finish

**Agents:** `ux` · `a11y` · `catalog-names` · `code-checker` → `verifier`  
**Branch:** `cursor/upscale-polish-560e`

## Scope

Post-declutter upscale after MagCloud strip + slim compose landed on main.

## Changes

| ID | Fix |
|----|-----|
| U1 | SVG image-icons for rail, admin tabs/presets, admin topbar (replaces unicode glyphs) |
| U2 | Admin topbar logo-only — no title/“admin” word brand chrome |
| U3 | Featured card skips blurb when it duplicates subtitle/title |
| U4 | Tighter essay CTA copy; empty-shelf upscale panel |
| U5 | Hero / compose / empty-shelf entrance motion (respects `prefers-reduced-motion`) |

## Residual WARN

- Site logo still identifies the house (access/hero/rail) — intentional brand mark, not alias picker
- Unicode empty-shelf mark `◈` is decorative only

## Verifier

`MERGE_OK` pending CI green + smoke.
