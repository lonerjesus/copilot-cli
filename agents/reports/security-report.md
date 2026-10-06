# security-report — Netflix house stream + single-session + admin upload

**Agent:** `security`  
**Branch:** `cursor/netflix-house-stream-560e` (diff vs `origin/main`)  
**Scope:** `token.ts` / `session.ts` / `store.ts` sid exclusivity · auth login/logout · `/api/catalog` · `validateCreateInput` · `AuthContext` kick · XSS / open redirect / fixation / priv-esc  
**Verdict:** **FAIL**

---

## Summary

Single-session (`sid` ↔ `activeSessionId`) is correctly enforced on **API** `getSessionUser*` paths, and HTTPS-only URL checks on admin media fields are sound. Catalog is auth-gated and house-filtered. Two issues block PASS: (1) auth-store read-modify-write races can undo `activeSessionId`, and (2) unvalidated `embed` passthrough can feed non-HTTPS / `javascript:` URLs into player fallback links.

---

## Findings

### FAIL — Auth store lost updates can break sid exclusivity

**Surface:** `src/lib/auth/store.ts` — `setActiveSession` / `clearActiveSession` vs `grantPurchase` / `recordDonation` / `updateUserBirthDate` / `createUser`

**Issue:** Each mutator does `readStore()` → mutate → `writeStore()`. `writeQueue` serializes **writes only**; reads sit outside the queue. A concurrent purchase/donation during login can write a stale snapshot and **revert** `activeSessionId` to a prior value (or drop the new sid). That re-activates the old cookie and/or invalidates the new one — exclusivity is not durable under concurrency.

**Required fix:** Perform read-modify-write **inside** the serialized queue (single `updateStore(mutator)` helper). All user-field updates must apply against the latest store under that lock.

---

### FAIL — `embed` accepted without URL / provider validation

**Surface:** `src/lib/content-store.ts` `validateCreateInput` · consumed by `PlayerDock` `EmbedStage` (`url={current.embed?.url ?? current.externalUrl}`)

**Issue:** `externalUrl` / `src` / `poster` require `https:`. `embed` is cast through unchecked. Admin `POST /api/admin/content` can set e.g. `{ provider: "bandcamp", url: "javascript:…" }`. Fallback UI renders `<a href={url}>`, which is a stored XSS / unsafe-navigation path for members who open the control.

Admin UI presets do not send `embed` today; the **API** still accepts it.

**Required fix:**
- Allowlist `embed.provider` to the known union.
- If `embed.url` / `embed.id` present, require `https:` (same as other media fields) or drop `embed` entirely when unused by admin presets.
- Prefer `safeExternalHref`-style checks before any `<a href>` / iframe construction (player already builds most iframes from allowlisted hosts).

---

### WARN — Middleware does not enforce `activeSessionId`

**Surface:** `src/middleware.ts` uses `hasValidSessionCookie` (HMAC + `exp` + `sid` **presence** only)

**Issue:** A superseded cookie remains middleware-valid. Gated **HTML** still loads; `AuthContext` kicks after `/api/auth/me` 401. APIs that call `getSessionUser*` correctly return 401 (smoke: `session-exclusive-old`). Residual: brief shell access / no-JS browsing with HMAC-valid stale cookies; documented in `netflix-house-stream.md`.

**Required fix (defense in depth):** Edge check against KV `activeSessionId`, **or** treat page gate like APIs (reject unless session resolves). Until then, keep client kick + API enforcement.

---

### PASS — Session token + attach / exclusivity happy path

| Check | Result |
|-------|--------|
| `newSessionId()` CSPRNG (18 bytes) | PASS |
| `encodeSession(uid, sid)` HMAC body | PASS |
| `parseSessionToken` requires non-empty `sid` | PASS |
| `attachSession` → `setActiveSession` then cookie | PASS |
| `userFromPayload` requires `activeSessionId === sid` | PASS |
| Login / register call `attachSession` (no fixation reuse) | PASS |
| Cookie: httpOnly, SameSite=Lax, secure in production | PASS |

---

### PASS — Logout

**Surface:** `src/app/api/auth/logout/route.ts`

- Resolves user via `getSessionUser` (sid-checked).
- `endSession` clears `activeSessionId` only for that user, then clears cookie.
- Superseded cookie: `getSessionUser` → null → cookie cleared, **active** sid untouched (correct).

---

### PASS — Catalog auth + house filter

**Surface:** `src/app/api/catalog/route.ts`

- 401 without session (`getSessionUser`).
- Returns `houseCatalog(...)` only (uploaded / house originals; outside → Footprint).
- `Cache-Control: private, max-age=30` appropriate for authed catalog.

---

### PASS — Admin upload privilege

**Surface:** `src/app/api/admin/content/route.ts` · `src/lib/admin.ts`

- GET/POST/DELETE require session **and** `isAdminEmail` (fail-closed if `ADMIN_EMAIL*` empty).
- Client `isAdmin` is display-only; API does not trust it.
- No member → admin escalation path in this diff.

---

### PASS — URL allowlist (HTTPS) on media fields

**Surface:** `validateCreateInput`

- `externalUrl` / `src` / `poster` parsed with `URL`; `protocol !== "https:"` rejected.
- Blocks `http:`, `javascript:`, `data:` on those fields.
- Length caps on title / blurb / body reduce abuse bulk.

---

### PASS — AuthContext session kick

**Surface:** `src/components/AuthContext.tsx`

- After load, null user → `router.replace("/access")` (hardcoded; no open redirect).
- Covers superseded sid ( `/api/auth/me` 401 ).
- Mounted on App / Admin / Footprint shells (not `/access` — no loop).

---

### PASS — Open redirect / fixation / classic XSS (text paths)

| Threat | Notes |
|--------|--------|
| Open redirect | `AuthContext` → `/access` only. `AccessGate.safeInternalPath` blocks `//`, `/\\`, `://`, `\`. Middleware `next=` is slightly weaker (pre-existing WARN — align with `safeInternalPath`). |
| Session fixation | Fresh `sid` + cookie on every login/register. |
| XSS via blurb/title/body | Rendered as React text nodes (no `dangerouslySetInnerHTML` on upload fields). |
| Privilege escalation | Admin = env email allowlist server-side only. |

---

## Threat model (this change set)

| Asset | Threat | Control | Status |
|-------|--------|---------|--------|
| Member session | Parallel logins | `sid` + `activeSessionId` | API OK; store race **FAIL** |
| Member session | Fixation | New sid on attach | PASS |
| House catalog | Unauthed scrape | Session + house filter | PASS |
| Admin uploads | Non-admin publish | `isAdminEmail` | PASS |
| Admin uploads | `javascript:` / non-HTTPS media | HTTPS on url/src/poster | PASS fields; **FAIL** on `embed` |
| Player | XSS via catalog links | React text; href from url | **FAIL** if malicious `embed` |
| Shell | Stale cookie after kick | AuthContext + me API | WARN (middleware gap) |

---

## Required fixes (merge-blocking)

1. **Atomic auth-store updates** — serialize full RMW for `setActiveSession` / `clearActiveSession` and other user mutators.
2. **Validate or reject `embed` in `validateCreateInput`** — provider allowlist + HTTPS URL (or ignore `embed` until UI needs it).
3. **(Recommended)** Align middleware page/`next` handling with sid resolution and `safeInternalPath`.

---

## OPS (unchanged)

- `AUTH_SECRET` ≥16 in production; bind `AUTH_KV` as KV Namespace.
- `ADMIN_EMAIL` / `ADMIN_EMAILS` required for admin upload in prod.

---

## Handoff

→ `cloudflare-deploy`, `verifier`: treat verdict **FAIL** until store RMW + `embed` validation land.
