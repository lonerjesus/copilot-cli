# Full audit follow-up — 2026-10-05

Wave: `catalog-names` ∥ `security` ∥ `ux`/`a11y` → fixes → **verifier**

## Verdict: `MERGE_OK` (code); Workers Builds PR check remains preview-config red

### Fixed this pass
| Issue | Fix |
|-------|-----|
| `/#categories` dead after rack | `FootprintShell` → `/#browse`; hash opens bay |
| Store soft-fail hid admin outages | `listUploads` rethrows `AuthStoreUnavailableError` |
| Home stream/browse/pay seed-only | Live `/api/catalog` in StreamDeck, CategoryBrowser, ContentPayActions |
| AgeGate missing on footprint/admin | Mounted `AgeGate` on both shells |
| Exact-name drift | catalog blurbs/hints corrected |
| Dead ContinuumRail / CHART_COPY / cosmogram data | Removed |
| Download filename injection | Sanitized `Content-Disposition` |
| `role="list"` without items | Dropped |

### Still open (ops / non-blocking)
- Workers Builds fails on PR branches (preview bindings); greens on `main`
- Set `ADMIN_EMAIL` in CF vars
- Vimeo channel URLs fallback to link (no numeric embed id)
- `ACCOUNT_GATE` / `AGE_GATE_REQUIRED` env vars unused (gates always on via middleware + AgeGate)
- WARN: Stripe webhook shared secret (not Stripe signature); checkout origin not pinned

### PASS areas
Auth session, admin API email gate, paywall API (fetched free / uploaded paid), oEmbed allowlists, OpenNext buildCommand, local Next build
