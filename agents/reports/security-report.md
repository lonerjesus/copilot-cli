# security-report — check-netflix-house

**Agent:** `security`  
**Branch:** `cursor/netflix-house-stream-560e`  
**Verdict:** `PASS` (with residual note)

## Findings

| ID | Severity | Status | Note |
|----|----------|--------|------|
| SEC-1 | High | PASS | Session exclusivity: `sid` in HMAC token + `activeSessionId` on user; mismatch → null session |
| SEC-2 | Medium | PASS | `/api/auth/me` clears stale cookie on 401; client logout on kick |
| SEC-3 | Medium | PASS | Admin upload URLs require `https:` for externalUrl/src/poster |
| SEC-4 | Low | PASS | Catalog API still auth-gated; house-only filter is authorization-neutral (not a leak) |
| SEC-5 | Info | WARN | Middleware cannot validate `activeSessionId` without KV; HMAC-valid superseded cookies pass page gate until `/api/auth/me` — mitigated by cookie clear + AuthContext redirect |

## Deps
No new dependencies.

## Required fixes
None blocking.
