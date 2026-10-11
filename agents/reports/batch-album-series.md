# Batch album / series upload

**Branch:** `cursor/batch-album-series-05af`  
**Agents:** security · ux · catalog-names · code-checker · a11y → qa-browser → verifier

## Shipped
- `CatalogItem.collection` (`album` \| `series` + id/title/index)
- Browser ZIP unpack (`src/lib/zip-unpack.ts`) — store + deflate, no npm deps, never on Worker
- Admin Compose modes: Single · Album · Series
- Multi-file / ZIP drop → sequential chunked upload + publish
- Stream rails group collections (`groupByCollection`)
- ID3 TALB / TRCK hints for track index/title

## Tests
- `npm run qa:collection-zip`
- `npm run qa:batch-collection` (API + admin UI)

## Redteam
No server-side unzip. Caps on ZIP size/count. Exact house names only for collection titles.
