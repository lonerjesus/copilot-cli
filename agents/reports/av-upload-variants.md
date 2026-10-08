# av-upload-variants

**Agents:** `content-ingest` · `ux` · `qa-browser` → `verifier`  
**Branch:** `cursor/av-upload-variants-560e`

## Delivered

| Change | Detail |
|--------|--------|
| MIME allowlist | MP3, M4A/AAC, WAV, FLAC, OGG/Opus, WebM audio, MP4/MOV/WebM/OGV video |
| Sniff | Magic bytes for ID3/MPEG, RIFF/WAVE, FLAC, Ogg, ftyp M4A/MP4/MOV + filename fallback |
| Admin UI | Music/video accept lists with explicit extensions; drop hints name formats |
| Serve | `/api/media` Content-Type from `.m4a`/`.flac`/… extensions |
| Guard | `npm run qa:av` + smoke `av-upload-types` |

## Verifier

`MERGE_OK` — house compose can ingest MP3 and sibling AV variants up to 512 MB (chunked).
