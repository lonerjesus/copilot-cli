# Writings ≠ MagCloud

**Branch:** `cursor/expert-tier-harden-560e`

## Clarification

House **writings** are admin-published notes (`kind: writing` + `body`) opened in `WritingReader`.  
**MagCloud** is an external chapbook archive on House Atlas only — never required to open a writing.

## Changes

- Replaced `MagazineContext` with `ReaderContext` (writing + photo overlays)
- Removed MagCloud/`magazine view` / `magazine ▦` affordances from stream/browse/player
- Unmounted `MagazineReader` from shells; deleted unused component
- `openReadable`: still → PhotoGallery, writing → WritingReader (no MagCloud gate)
- Writing reader chrome labels **house writing**
- Atlas copy clarifies MagCloud is archive-only

## Verify

`tsc --noEmit` green; prior writing-open E2E still valid (catalog body → readable, not MagCloud).
