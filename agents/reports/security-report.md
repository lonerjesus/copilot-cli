# security-report — batch album/series

**Verdict:** PASS

- **No new npm dependencies**
- ZIP unpack is **browser-only** (`src/lib/zip-unpack.ts`) — not imported by API routes
- Caps: 48 files, ~1.5 GiB uncompressed total; skip `__MACOSX` / `.DS_Store`
- Media still goes through existing allowlisted MIME + chunked `/api/admin/media`
- Collection type enum fail-closed (`album` \| `series` only)
- Admin-only routes unchanged (session + isAdminEmail)
