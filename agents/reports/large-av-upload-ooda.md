# Large AV upload OODA — 124 MB HEVC → 15 min

## OBSERVE
Screenshot clip: **1080×1350 HEVC / Dolby Vision · 124.5 MB · 2:00 · 30 fps**.  
User needs up to **~15 min** (≈900 MB–1 GB at similar bitrate). Ceiling was 512 MB; complete re-buffered misaligned 8 MiB→3 MiB KV parts (CPU / 1102 risk).

## ORIENT
Prod stores on **AUTH_KV** (no MEDIA_R2). Fix must work without R2: align upload parts to KV parts + resumable promote.

## DECIDE / ACT
- `MAX_MEDIA_BYTES` → **1536 MiB**
- `UPLOAD_CHUNK_BYTES` = **KV_CHUNK (3 MiB)** — 1:1 promote
- Resumable `/complete` (202 + batches of 32)
- Client: parallel chunks (2–3), MB progress, finish loop
- HEVC / `video/hevc` aliases + ftyp brands

## REDTEAM
Optional R2 still recommended for multi‑GB later; KV key count for 1.5 GiB ≈ 512 parts — OK with batched promote.
