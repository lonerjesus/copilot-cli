# security-report

**Agent:** security  
**Scope:** `src/middleware.ts`, `src/lib/auth/**`, `src/app/api/auth/**`, `src/app/api/commerce/**`, `src/app/api/donate/**`, `src/lib/auth/bot.ts`, `src/app/robots.ts`, `next.config.ts` headers, `public/_headers`  
**Branch base:** `cursor/full-audit-560e`  
**Verdict:** FAIL (1 production blocker)

---

## Findings

### PASS — Account gate

- `src/middleware.ts` redirects unauthenticated non-public HTML to `/access`; non-public `/api/*` returns `401 auth_required`.
- `src/lib/auth/bot.ts` `PUBLIC_PATHS` is an exact allowlist only (`/access`, auth login/register/logout/me, webhook, robots/favicon/sitemap).
- `/api/donate`, `/api/commerce/purchase`, `/api/commerce/download`, `/api/feed`, `/api/oembed`, `/api/ingest` are session-gated by middleware.

### PASS — Session HMAC edge/node parity

- Sessions sign/verify only via Web Crypto in `src/lib/auth/token.ts` (no `node:crypto` on the session path).
- Middleware (`hasValidSessionCookie`) and Node routes (`parseSessionToken` via `src/lib/auth/session.ts`) share the same helpers, `DEV_AUTH_SECRET`, and `AUTH_SECRET` rules (≥16 chars; throw in production if missing).
- Verified Node `createHmac` vs Web Crypto HMAC-SHA256 produce identical base64url digests for the same secret+body (license signing in `src/lib/auth/crypto.ts` is separate and Node-only).

### PASS — Bot UA blocking

- `src/lib/auth/bot.ts` `isSuspiciousBot` rejects empty/short UA and known scraper/automation UA patterns.
- Applied in `src/middleware.ts` to login/register (403), unauthenticated non-public API (403), and unauthenticated HTML except `/access` (403).

### PASS — Honeypot

- Hidden `website` field in `src/components/AccessGate.tsx`; rejected in `src/app/api/auth/register/route.ts` and `src/app/api/auth/login/route.ts` when non-empty.

### PASS — safeInternalPath

- `src/components/AccessGate.tsx` blocks non-relative, `//`, `/\\`, `://`, and `\` before post-login navigation.
- Middleware sets `next` from `pathname` only (not raw query), reducing open-redirect surface at the redirect-to-gate step.

### PASS — Paywall 402

- `src/app/api/commerce/download/route.ts` returns `402` + `purchase_required` when the session user lacks `purchasedCatalogIds` entry; owned downloads attach `Content-Disposition` + `no-store`.
- Stream/view remains account-gated only (by design); save/download is the paid surface (`src/components/ContentPayActions.tsx`, `src/components/SaveGuard.tsx`).

### PASS — Webhook fail-closed

- `src/app/api/commerce/webhook/route.ts`: missing/short `STRIPE_WEBHOOK_SECRET` → `503 webhook_disabled`; bad/missing `x-kn-webhook-secret` → `401` via `safeEqual`.
- Entitlement grants run only after secret check; demo free-grants disabled in production unless `ALLOW_DEMO_PAYMENTS=1` (`src/lib/commerce/checkout.ts`). `wrangler.toml` does not enable demo payments.

### PASS — Cookie flags

- `src/lib/auth/session.ts`: `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, `secure` when `NODE_ENV === "production"`, `maxAge` aligned with `MAX_AGE_SEC`.

### PASS — CSP / noindex (runtime gate)

- `src/middleware.ts` sets CSP (no `unsafe-eval`), `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`, HSTS, COOP/CORP, frame deny.
- `src/app/robots.ts` disallows `/` for `*`; `src/app/layout.tsx` / `src/app/access/page.tsx` metadata robots also noindex.

### WARN — Rate limits (in-memory)

- `src/lib/auth/bot.ts` `rateLimitAllow` uses a process-local `Map` (global 120/min, auth 12/min in `src/middleware.ts`).
- On Cloudflare Workers this is per-isolate and reset-prone; not a durable abuse control.

### WARN — Header surface inconsistency

- Full CSP + `X-Robots-Tag` live in `src/middleware.ts` only.
- `next.config.ts` `headers` omits CSP, COOP, CORP, and `X-Robots-Tag`.
- `public/_headers` has COOP/CORP/noindex but omits CSP and `noimageindex`.

### WARN — Webhook authenticity model

- Shared header secret is fail-closed, but body is not verified with Stripe-signed payloads (`Stripe-Signature`). Compromise of `STRIPE_WEBHOOK_SECRET` allows forged entitlement JSON.

### WARN — Bot UA is spoofable

- UA denylist is belt-and-suspenders only; a browser-like UA bypasses it. Account session remains the real gate.

### WARN — Password hashing cost knobs

- `src/lib/auth/crypto.ts` uses `scryptSync` with default Node cost parameters (no explicit `N`/`r`/`p`). Acceptable defaults; tune if Workers CPU budget or offline-attack resistance needs tightening.

### FAIL — Auth store on Workers (non-durable)

- `src/lib/auth/store.ts` falls back to in-memory `globalThis.__knAuthStore` when filesystem writes fail (Workers).
- Accounts, purchases, and donations do not survive isolate recycle or fan-out across isolates. Production deploy of account/paywall on Workers is unsafe until durable storage is wired.
- Comment in-file already notes “until D1/KV is wired”; `wrangler.toml` has no D1/KV binding.

---

## Minimal fix for FAIL

1. Add a D1 (preferred) or KV binding in `wrangler.toml`, e.g. `AUTH_DB` / `AUTH_KV`.
2. In `src/lib/auth/store.ts`, when `getCloudflareContext()` exposes that binding, read/write the `AuthStore` JSON (or normalized tables) there; keep `.data/auth-store.json` only for local Node.
3. Fail closed in production if neither filesystem nor binding is available (do not silently accept registrations into ephemeral memory).
4. Smoke: register → new isolate / second request → `/api/auth/me` and owned download still resolve.

---

## Exact-name policy

House names only; no third-party artist/label conflation in this audit.
