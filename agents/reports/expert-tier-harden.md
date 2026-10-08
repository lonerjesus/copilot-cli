# Expert-tier harden — admin saves + metadata + screen adapt

## Scope
Post-#33 polish: durable saves, file metadata fill, catalog safety, keyboard/fixed Save, media-ref normalize.

## Changes
- `formRef` / `editingIdRef` — upload/PATCH keeps title/tags typed mid-upload
- `extractUploadMeta` — ID3 title/artist, AV duration, image/video dimensions into compose
- Catalog fail-closed on corrupt JSON; full RMW queue (no silent wipe / lost rows)
- Upload uses head-slice sniff + `file.slice` chunks (no full-file ArrayBuffer)
- Still poster clear honored; thumb `accept` includes extensions for iOS
- Fixed Save bar ≤720px (sticky no longer overlaps thumbnail)
- `qa:media-ref` + `qa:media-meta`; e2e house-path + chunked + clear-poster

## Verify
- Unit + e2e + smoke before merge
- Workers Builds on merge

## Agents
catalog-names · security · ux · a11y · code-checker → verifier
