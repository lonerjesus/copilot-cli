# writings-upload-ticker

**Branch:** `cursor/writings-upload-ticker-560e`  
**Agents:** `ux` · `catalog-names` · `security` · `cloudflare-deploy` → `verifier`

## Delivered

| ID | Change |
|----|--------|
| W1 | Play chrome only on AV (`video` / `audio` / `vlog` / `live`). Writings/stills: no ▶, no open glyph, no +next / mag player chrome |
| W2 | Kind `essay` → `writing` (legacy normalized on read). Writing subs: **notes · fiction · nonfiction** |
| W3 | Admin site ticker (Data tab) — scrolls under 18+ banner; not found in accessible GH repos, rebuilt |
| W4 | Media ceiling **512 MB** via chunked upload (`/api/admin/media/init|chunk|complete`); single-shot still ≤85 MB |

## Repo check (ticker)

Searched `lonerjesus/*` + this repo history for admin marquee/ticker. Only leftover CSS was `.footprint__ticker` (unused). No old ticket source in listed GitHub repos — reimplemented as `SiteTicker` + `/api/admin/ticker`.

## Verdict

`MERGE_OK`
