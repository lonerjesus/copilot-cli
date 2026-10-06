# perf-notes — Netflix house stream

**Agent:** `performance`  
**Branch:** `cursor/netflix-house-stream-560e` lineage vs `origin/main`  
**Verdict:** PASS

## Scope

StreamDeck / CategoryBrowser client fetch, house-filter efficiency, shelf render budget.

## Budgets touched

| Path | Finding |
|------|---------|
| `GET /api/catalog` | Authed; `houseCatalog` only; `Cache-Control: private, max-age=30` |
| StreamDeck seed | `useState(() => houseCatalog(CATALOG))` — sync; seed ≈ 2 uploaded rows |
| StreamDeck fetch | One mount fetch + `alive` guard; DriveBay mounts children only when open → no dual fetch with browse |
| CategoryBrowser | Same fetch; `useDeferredValue(query)` + `useMemo` filter/group; `startTransition` on category/clear |
| House filter | `isHouseMedia` / `houseCatalog` O(n) — fine at current size |
| Shelves | `rowItems` rebuilds per row each render; FEATURED sorts by `publishedAt` |

## Regressions

None. Home stream no longer hydrates outside CDN posters (Footprint-only) — net win. AliasMatrix removal shrinks client surface.

## Must-fix polish

1. Drop redundant StreamDeck filter — API already returns house-only; `houseCatalog(data.items.filter(isHouseMedia))` double-filters.
2. Memoize shelf rows (`useMemo` on `live`) so FEATURED sort skips player/active-tile re-renders.
3. Abort catalog fetches with `AbortController` on bay remount / `browseKey` bump.
4. Optional shared catalog hook to avoid re-fetch when switching Stream ↔ Browse.

## Residual

Thin house seed → empty VIDEOS/MUSIC/PHOTOS until admin uploads (empty-state present; not a perf risk).
