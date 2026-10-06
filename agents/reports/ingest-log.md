# ingest-log — check-netflix-house

**Agent:** `content-ingest`  
**Verdict:** `PASS` (reorganize only — no new third-party nodes)

## Changes
| Action | Detail |
|--------|--------|
| STREAM_ROWS | Replaced platform shelves with house Netflix rows (Featured / Videos / Music / Photos / Reading) |
| Footprint | `catalogToFootprint` filters to `isFetchedMedia` only |
| Seed uploads | `qtoss-vol1`, `qtoss-vol2` remain house (`source: uploaded`) |

## Policy
exact-house-names-only · no invented platforms
