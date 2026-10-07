# poster-play-fix — essay play glyph + thumbnail persistence

**Agents:** `ux` · `security` · `code-checker` → `verifier`  
**Branch:** `cursor/poster-play-fix-560e`

## Findings

| ID | Issue | Fix |
|----|-------|-----|
| P1 | Featured + shelf tiles always painted `▶` — including `essay` / `still` | Gate play chrome on `isPlayableMedia`; essays get amber open glyph |
| P2 | House posters via bare `<img src="/api/media/…">` often failed → letter fallback | Credentialed `fetch` → blob URL (`HouseMediaImage` / `MediaPoster`) |
| P3 | Mobile MIME (`image/jpg`, empty type, HEIC) rejected as `invalid_type` | Magic-byte sniff + aliases; clear HEIC error |
| P4 | Middleware matcher skipped any `*.jpg|png|…` path — including `/api/media/house/*.jpg` | Matcher only skips `_next/static` / `_next/image` |

## Verdict

`MERGE_OK` — play affordance AV-only; thumbnail upload/serve hardened for Workers + iPhone.
