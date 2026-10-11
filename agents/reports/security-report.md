# security-report — production redteam (API / auth / media)

**Verdict:** FAIL — not `MERGE_OK_SECURITY` until HIGH items below are addressed.

Scope: `src/app/api/**`, `src/lib/media-store.ts`, `media-ref.ts`, `admin.ts`, `auth/**`, `security-headers.ts`, `zip-unpack.ts`, middleware rate limits.

---

## HIGH

### 1. Open registration can claim `ADMIN_EMAIL`
- **Where:** `src/app/api/auth/register/route.ts`, `src/lib/auth/store.ts` (`createUser`), `src/lib/admin.ts`
- **Issue:** Admin is email-allowlist only. Anyone who registers the configured `ADMIN_EMAIL` first gets full `/api/admin/**` (media upload, content, stats). Email is public in `wrangler.toml` / `.env.example`.
- **Fix:** In `createUser` / register: if `isAdminEmail(email)`, reject unless an explicit bootstrap flag (e.g. `ADMIN_BOOTSTRAP=1`) is set, or require admin users to be seeded offline and never creatable via public register.

### 2. ZIP inflate ignores real uncompressed size (admin browser DoS)
- **Where:** `src/lib/zip-unpack.ts` (`unpackZip` / `inflateRaw`)
- **Issue:** Budget uses central-directory `uncompSize`. For method 8, mismatched/zero `uncompSize` still accepts inflate output (`raw.byteLength !== uncompSize` only errors for store). A small ZIP can expand past `DEFAULT_MAX_TOTAL` in the admin tab (`AdminStation` batch unpack).
- **Fix:** After inflate, enforce `raw.byteLength === entry.uncompSize` (or treat actual length as authoritative), add actual bytes into `totalUncomp`, and abort if actual > remaining budget / `maxTotal`. Prefer streaming inflate with a hard byte cap.

### 3. Single-shot upload ignores `SINGLE_SHOT_MAX_BYTES`
- **Where:** `src/app/api/admin/media/route.ts`, `src/lib/media-store.ts`
- **Issue:** Client respects `SINGLE_SHOT_MAX_BYTES` (20 MiB); server only enforces `MAX_MEDIA_BYTES` (1.5 GiB). Authenticated admin (or stolen admin session) can `POST` a huge multipart body and OOM / Error 1102 the Worker.
- **Fix:** After `arrayBuffer()`, reject if `data.byteLength > SINGLE_SHOT_MAX_BYTES` with `413` / `use_chunked_upload`.

---

## MEDIUM

### 4. In-memory rate limits are per-isolate (easy to dilute on Workers)
- **Where:** `src/lib/auth/bot.ts` (`rateLimitAllow`), `src/middleware.ts`
- **Issue:** `Map` buckets do not share across Cloudflare isolates; login/register ceilings (12/min) are weaker than they appear.
- **Fix:** Durable limiter via `AUTH_KV` (or CF rate-limiting rules) for `/api/auth/login` + `/register` (+ optional failed-login lockout).

### 5. Chunked upload sessions never expire
- **Where:** `src/lib/media-store.ts` (`initChunkedUpload` / `putUploadMeta`)
- **Issue:** `createdAt` is stored but unused; abandoned `media-up:*` parts can fill KV/R2 staging up to declared size × many sessions (admin-auth required; 600/min media bucket).
- **Fix:** Reject sessions older than e.g. 24h in chunk/complete; set KV expirationTtl on `media-up:*` keys; optional GC on init.

### 6. R2 complete path does not verify assembled byte length
- **Where:** `src/lib/media-store.ts` (`materializeR2FromChunks`, `completeChunkedUpload`)
- **Issue:** KV path checks part sizes / totals; R2 streams parts into `put` with no post-`head()` size === `session.size`. A short/failed stream risk is lower (atomic put) but integrity parity is missing.
- **Fix:** After `r2.put`, `head(session.key)` and require `size === session.size` or delete + `upload_corrupt`.

### 7. Prod CSP still allows `script-src 'unsafe-inline'`
- **Where:** `src/lib/security-headers.ts`
- **Issue:** Any future XSS becomes immediately script-capable. `img-src` / `media-src` `https:` are wide (embed-driven).
- **Fix:** Move to nonce/hash CSP for scripts when OpenNext allows; keep embed allowlists tight on `frame-src` / `connect-src` (already better than script).

---

## Residual (not ranked / accept)

- Media GET/HEAD session-gated; `house/` + `..` checks OK; no unauthenticated oversized upload path found.
- Upload/chunk/complete all require session + `isAdminEmail`.
- Path traversal on media keys / `media-ref` fail closed for `..`.
- Secrets not echoed by APIs; `AUTH_SECRET` fail-closed in production.
- Webhook fail-closed without `STRIPE_WEBHOOK_SECRET`; uses shared header secret (ops: keep strong).
- Forgot-password is stub + non-enumerating.
- Middleware session check is HMAC-only (revoked `sid` still passes edge); route handlers re-check active session — residual UX hole, not admin bypass.

**Merge gate:** address HIGH #1–#3 before calling security merge-ready.
