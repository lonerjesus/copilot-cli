# admin-upscale-audit — R2/KV media + Tumblr-style admin

**Agents:** `security` · `a11y` · `ux` · `catalog-names` · `cloudflare-deploy` · `code-checker` → `verifier`  
**Branch:** `cursor/r2-media-upload-560e`  
**Verdict (after fixes):** `MERGE_OK`

## CI root cause (Workers Builds)

| Commit | Failure |
|--------|---------|
| `e85aafa` | Deploy referenced missing R2 bucket `kamaunegasi-media` |
| `1207f2f` | `ensure-r2-bucket.sh` exited 1 during build (token lacks R2 Edit) |

**Fix:** Remove hard `[[r2_buckets]]` from `wrangler.toml`. House media defaults to **AUTH_KV chunks**; optional R2 when `MEDIA_R2` is bound later. Ensure script is soft-only (`npm run cf:ensure-r2`).

## Must-fixes applied

| ID | Fix |
|----|-----|
| A1 | Brand `<select>` from exact `ALIASES`; server `invalid_brand` if unknown |
| A2 | Drop zone is `<label htmlFor>`; `aria-busy`; disabled while uploading |
| A3 | Client `validateUploadFile` preflight + 95 MB hint |
| A4 | Mobile library stacks ≤480px; taller tab targets |
| CI | KV media fallback; no R2 required for Workers Builds |

## Residual WARN

- `/api/media` is member-session (stream model); purchase still gates JSON download
- Compose may orphan drafts if upload then abandon (delete cleans published URLs)

## Verifier

`MERGE_OK` — exact-name brands locked, admin APIs fail-closed, Workers Builds no longer depends on missing R2 bucket.
