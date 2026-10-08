# Media cutoff fix — extreme harden

## Symptom
Uploaded song cuts off early during playback.

## Root cause
1. Progressive `/api/media` without honest Range / incomplete KV reassembly → buffer dies mid-file → false `ended`.
2. Full-object probe on every Range request (KV) burned CPU and risked truncated bodies.
3. Bare `<audio src>` progressive play could stop once the initial buffer ended.

## Fix (beyond industry baseline)
- **Meta-first Range**: `getHouseMediaMeta` + partial KV reads (`getKvMediaRange`); R2 prefers `head()`.
- **Integrity fail-closed**: 503 on length mismatch (`media_integrity_mismatch` / `media_range_incomplete`).
- **`X-KN-Media: house-range`** + `Accept-Ranges` on GET/HEAD.
- **NativeMedia extreme path**:
  - credentialed full-file **blob** play for house AV ≤ 48 MiB (verified byte count)
  - progressive Range fallback above ceiling
  - stall recovery on `waiting` / `stalled` / `error`
  - false-`ended` guard (only advance queue when truly at EOF)

## Verify
`qa:media-range` · guest E2E · build:next
