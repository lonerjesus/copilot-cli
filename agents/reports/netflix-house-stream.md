# verify-verdict — Netflix house stream

**Branch:** `cursor/netflix-house-stream-560e`  
**PR:** #15  
**Result:** `MERGE_OK` (code + smoke)

## Checks
- `npm run build:next` — pass
- `scripts/qa-smoke.sh` — **52 passed · 0 failed**
  - house stream posters (no outside CDN on home)
  - no Names bay
  - Footprint still carries outside media
  - session-exclusive-old → 401 / session-exclusive-new → 200

## Delivered
1. Outside/fetched catalog → Footprint only; member `/api/catalog` = house uploads
2. Names section deleted (`AliasMatrix` removed)
3. Netflix shelves + admin Video/Photo/Music presets
4. One login at a time (`sid` + `activeSessionId`)

## Residual
- Seed house catalog is thin (chapbooks) until admin uploads fill shelves
- Middleware cannot yet revoke HMAC-valid superseded cookies without KV; APIs + AuthContext kick them
