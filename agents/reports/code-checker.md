# code-checker — check-netflix-house

**Agent:** `code-checker`  
**Verdict:** `PASS`

## Must-fix (done this pass)
- [x] Clear superseded session cookie on `/api/auth/me` 401
- [x] AuthContext logout on 401 so middleware stops treating client as authed
- [x] Empty stream CTA points to Footprint
- [x] `tsc --noEmit` clean
- [x] House/fetched helpers (`isHouseMedia` / `isFetchedMedia`) consistent between catalog API + Footprint

## Residual risk
- Seed house catalog thin until admin uploads — shelves hide when empty (by design)
- Middleware sid-store check still deferred (SEC-5)

## Smoke expectations
`session-exclusive-old` 401 · `session-exclusive-new` 200 · `home-no-names-bay` · `footprint-outside-media`
