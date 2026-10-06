# perf-notes.md

**Agent:** `performance`  
**Verdict:** `PASS`

- Catalog payload smaller (house-only) — fewer tiles hydrate
- StreamDeck/CategoryBrowser still one `/api/catalog` fetch
- No new client deps; no layout thrash introduced beyond existing shelf scroll
