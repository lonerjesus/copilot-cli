# code-checker — Netflix house stream

**Agent:** `code-checker`  
**Branch:** `cursor/netflix-house-stream-560e` lineage vs `origin/main`  
**Verdict:** PASS

## Checks

### House / fetched split — OK

- `isHouseMedia` / `houseCatalog` / `isFetchedMedia` in `src/data/catalog.ts`.
- `GET /api/catalog` → `houseCatalog(await getLiveCatalog())` (401 unauthed).
- `catalogToFootprint` → `isFetchedMedia` only.
- Seed: 2× `source: "uploaded"` (QUARANTINED THOUGHTS… / Streetpolitik) + fetched tagged; MagCloud legacy via `isPaywalled`.
- StreamDeck / CategoryBrowser apply `houseCatalog` on seed + live.

### Single-session races — OK (RMW fixed in tree)

- Cookie `sid` + `attachSession` → `setActiveSession`; `userFromPayload` requires match.
- `updateStore` serializes full read-modify-write for session/purchase/donation mutators (addresses store clobber).
- `/api/auth/me` clears stale cookie on 401; AuthContext logout + redirect `/access`.
- Smoke: `session-exclusive-old` 401 · `session-exclusive-new` 200.

**Residual:** Middleware `hasValidSessionCookie` still HMAC/`sid`-shape only — superseded cookies pass Edge page gate until me-kick (SEC-5).

### AdminStation validation — OK with one open polish

- Client: required fields, URL inputs, presets Video/Photo/Music, brand default `Telling Show Of Love`, `paywalled` default true.
- Server: https on external/src/poster; kind allowlist; bounds; **embed** provider allowlist + https (fixed).
- **Open must-fix:** `createUpload` still does `source: paywalled === false ? "fetched" : "uploaded"`. Unchecking paywall drops house upload from Netflix stream. Keep `source: "uploaded"` for admin publishes; paywall is orthogonal.

### TypeScript / smoke — OK

| Risk | Note |
|------|------|
| JSON `as` casts on catalog/me | Low — same-origin |
| Taxonomy membership not checked vs `CATEGORIES` | Polish |
| `qa-smoke` house posters / no Names / Footprint outside / session exclusivity | Good |

## Must-fix polish

1. **Decouple paywall from `source` in `createUpload`** — admin publishes always `uploaded`.
2. Validate category/subcategory against `CATEGORIES`.
3. StreamDeck: remove redundant `filter(isHouseMedia)`.
4. Follow-up: Edge `activeSessionId` check when AUTH_KV readable from middleware.

## Residual risk

Thin house seed until admin fills shelves. Middleware sid-store check deferred.
