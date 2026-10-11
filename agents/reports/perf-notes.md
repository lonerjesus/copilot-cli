# perf-notes — batch album/series

**Verdict:** PASS

- Sequential batch uploads (no parallel Worker storm)
- ZIP inflate only in browser; Worker still streams chunks
- Collection grouping is O(n) on already-fetched catalog
