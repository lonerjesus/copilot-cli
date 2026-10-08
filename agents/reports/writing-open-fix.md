# Writing click no-op fix

## Root cause
After MagCloud removal, `MAGAZINE_ISSUES` is empty. Stream/Browse activate paths for non-AV items only called `openMagazine` when `hasMagazine(id)` — writings always returned early with **no UI**.

## Fix
- `WritingReader` modal for house notes/stills (title, body, poster, paywall)
- `openReadable(item)` in MagazineContext — magazine OR writing reader
- Wired StreamDeck, CategoryBrowser, FootprintArchive (+ FootprintShell mount)
- Catalog `body?: string` + `isReadableText()`
- Analytics `writing_open`

## Verify
`qa:writing-open` 15/15 · edit-save 15 · smoke 60 · build:next green
