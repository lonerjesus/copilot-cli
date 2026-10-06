# kamaunegasi.net — Agent Runbook

When to invoke which agents on every PR/change. Pair with [`ROSTER.md`](./ROSTER.md) and [`squad.json`](./squad.json).

## Always (every PR)

| Agent | Why |
|-------|-----|
| `catalog-names` | Exact-name policy on any touched copy/data |
| `security` | Diff may introduce deps, APIs, embeds, or XSS vectors |
| `verifier` | Final merge gate — **always last, never skipped** |

Minimum path:

```
catalog-names ∥ security  →  verifier
```

## Trigger matrix

Invoke an agent when **any** listed path/signal matches. Run Wave A agents in parallel when independent; serialize only on shared-file ownership conflicts.

| Change signal | Agents (Wave A) | Then |
|---------------|-----------------|------|
| `src/data/catalog.ts`, `magazine.ts`, taxonomy, ingest URLs | `catalog-names`, `content-ingest`, `compliance-18plus` | `qa-browser` if UI surfaces new items → `verifier` |
| `src/data/identity.ts`, brand/copy strings, metadata titles | `catalog-names` | `verifier` |
| `src/app/api/**`, oEmbed/feed allowlists, `package.json` deps | `security` | `cloudflare-deploy` if config/build also touched → `verifier` |
| `src/components/**`, CSS/tokens, layout/motion | `ux`, `a11y`, `performance`, `analytics-bounce` | `qa-browser` → `verifier` |
| Player, stream deck, footprint → play handoff | `ux`, `performance`, `analytics-bounce`, `a11y` | `qa-browser` → `verifier` |
| Boot / age gate / 18+ copy | `compliance-18plus`, `ux`, `catalog-names` | `qa-browser` → `verifier` |
| `wrangler.toml`, `next.config.ts`, deploy docs, build scripts | `cloudflare-deploy`, `security`, `performance` | `verifier` |
| README / AGENTS / docs only | `catalog-names` (if names mentioned) | `verifier` |
| Analytics, CTA, empty-states, SEO blurbs | `analytics-bounce`, `catalog-names` | `qa-browser` if UI → `verifier` |

## Wave rules

1. **Parallel:** All Wave A agents whose triggers fire run concurrently unless two claim the same file — then assign a single writer (`content-ingest` owns data files; `ux` owns presentation components).
2. **Wave B:** `qa-browser` runs after Wave A completes for UI, a11y, perf, compliance, or bounce work.
3. **Wave C:** `cloudflare-deploy` after Wave A when deploy/config touched (may skip if docs-only mention of Cloudflare with no config diff).
4. **Wave D:** `verifier` last. Inputs = full diff + all reports. Verdict `MERGE_OK` or `MERGE_BLOCKED`.

## Ownership (conflict resolution)

| Surface | Writer |
|---------|--------|
| `src/data/*` | `content-ingest` (names checked by `catalog-names`) |
| Visual components / CSS | `ux` (a11y patches coordinated in same PR) |
| API routes / config / deps | `security` |
| `wrangler.toml` / deploy scripts | `cloudflare-deploy` |

## Definition of done

- Every invoked agent produced its named output artifact (see ROSTER).
- No `FAIL` / `BLOCKER` left open.
- Exact-name policy clean.
- `verifier` → `MERGE_OK`.

## Quick recipes

**Catalog drop (new essay/track/live node)**  
`(catalog-names → content-ingest) ∥ compliance-18plus` → `qa-browser` → `verifier`

**UI polish**  
`ux` ∥ `a11y` ∥ `performance` ∥ `analytics-bounce` ∥ `catalog-names` ∥ `security` ∥ `code-checker` → `qa-browser` → `verifier`

**API / oEmbed change**  
`security` ∥ `performance` ∥ `catalog-names` ∥ `code-checker` → `qa-browser` (smoke play path) → `cloudflare-deploy` (if edge/config) → `verifier`

**Deploy-only**  
`cloudflare-deploy` ∥ `security` ∥ `performance` → `verifier`

**Netflix house / session / Footprint split**  
`check-netflix-house` pack — see [`checkers/README.md`](./checkers/README.md)
