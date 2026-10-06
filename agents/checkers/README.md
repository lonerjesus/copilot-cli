# Expert code checkers

Task-scoped production gates for **www.kamaunegasi.net**.  
Exact house names only — see [`ROSTER.md`](../ROSTER.md). Verifier always last.

These checkers extend the permanent squad. Invoke one **task checker** (below) plus the always-on Wave A pair (`catalog-names` ∥ `security`), then Wave B–D per [`RUNBOOK.md`](../RUNBOOK.md).

## Always-on (every PR)

| Checker | Agent id | Report |
|---------|----------|--------|
| Exact names | `catalog-names` | `names-audit.md` |
| Threat model | `security` | `security-report.md` |
| Merge gate | `verifier` | `verify-verdict.md` |

## Task checkers

### `check-responsive`

| | |
|---|---|
| **Task** | Shell adapts to phone / tablet / desktop |
| **Agents** | `ux` · `a11y` · `performance` · `qa-browser` |
| **Focus** | First viewport, drive rack, command bar, player dock; no horizontal overflow |
| **Report pack** | `ux-checklist.md`, `a11y-report.md`, `perf-notes.md`, `qa-browser.md` |

### `check-stream-ux`

| | |
|---|---|
| **Task** | Spotify × Apple TV stream shelves + Up Next |
| **Agents** | `ux` · `a11y` · `performance` · `analytics-bounce` · `qa-browser` |
| **Focus** | Featured shelf, queue next, keyboard row scroll, play handoff |
| **Report pack** | `ux-checklist.md`, `a11y-report.md`, `perf-notes.md`, `bounce-risk.md`, `qa-browser.md` |

### `check-netflix-house`

| | |
|---|---|
| **Task** | House-only Netflix stream · Footprint outside · Names removed · single login · admin upload |
| **Agents** | `code-checker` · `security` · `catalog-names` · `content-ingest` · `compliance-18plus` · `ux` · `a11y` · `analytics-bounce` · `qa-browser` |
| **Focus** | `isHouseMedia` / Footprint filter · `sid` exclusivity · no Names bay · admin Video/Photo/Music · empty-shelf UX |
| **Report pack** | `code-checker.md`, `security-report.md`, `names-audit.md`, `ingest-log.md`, `compliance-18plus.md`, `ux-checklist.md`, `a11y-report.md`, `bounce-risk.md`, `qa-browser.md` |

### `check-deploy`

| | |
|---|---|
| **Task** | Production deploy readiness |
| **Agents** | `cloudflare-deploy` · `security` · `performance` · `verifier` |
| **Focus** | Workers build green, AUTH_KV, custom domains, smoke on preview then main |
| **Report pack** | `deploy-check.md`, `security-report.md`, `perf-notes.md`, `verify-verdict.md` |

## `code-checker` (new specialist)

| | |
|---|---|
| **Mission** | Correctness & production polish: types, API contracts, catalog splits, session races, dead UI. |
| **Inputs** | Full PR diff; auth/session; catalog helpers; admin upload validation; smoke script. |
| **Outputs** | `code-checker.md` — `PASS`/`FAIL`, must-fix list, residual risk. |
| **Handoff** | Wave A (parallel with `security`). Feeds `qa-browser`, `verifier`. |

## Production-ready recipe (stacked UI + auth)

```
Wave A parallel:
  code-checker ∥ security ∥ catalog-names ∥ compliance-18plus ∥
  ux ∥ a11y ∥ performance ∥ analytics-bounce ∥ content-ingest

Wave B: qa-browser
Wave C: cloudflare-deploy
Wave D: verifier → MERGE_OK only then merge + deploy
```

## Merge order (this stack)

1. `#15` `cursor/netflix-house-stream-560e` — **includes** responsive (#13) + stream UX (#14)
2. Close #13 / #14 as superseded after #15 merges
3. Optional: #9 Cloud Agent env docs (independent)
4. Deploy from `main` (Workers Builds) after verifier `MERGE_OK`
