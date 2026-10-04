# kamaunegasi.net — Agent Roster

Permanent multi-agent cooperation protocol for the Next.js repo at `/workspace`.  
Source of truth for names: `src/data/identity.ts` (`ALIASES`, `PRIMARY_NAME`, `BIRTH_NAME`, `SITE`).

## Mission

Ship zero-error changes to **www.kamaunegasi.net** while preserving house identity, 18+ compliance, terminal UX, catalog integrity, and Cloudflare deploy readiness. Agents cooperate in waves; **verifier always runs last**.

## Exact-name policy (binding)

Use **exact house spellings only**. Never invent, “correct,” expand, or conflate with third-party brands.

| Canonical | Allowed short |
|-----------|---------------|
| Kendrick Tirrell Herring | — |
| Kendrick-Kamau Negasi | — |
| Kamau Salaam Nasser | — |
| Streetpolitik | — |
| Faust Fakeway | — |
| GrownAssKids | GAK |
| Black Oh-My | — |
| BLKDTY Music LLC | — |
| Kendrick-Kamau Negasi LLC | — |
| Thelonious1 | TL1 |
| Telling Show Of Love | TSOL |
| Telling Stills Of Love | — |
| Imponderabilia: Wall_Carpet 235 | — |
| 357Itsumi | — |
| LoveDrugVendingMachine | — |
| GRUNGEzhou | — |
| GRUNGEzhou Libellus | — |
| GRUNGEzhou Supply | — |
| Golden Crow | — |
| Golden Crow Acquisitions | — |
| QUARANTINED THOUGHTS OF A STREET STATISTIC | — |
| STPK's Smoker's Lounge Music | — |
| Telling Songs As Content | — |
| 30over9 | — |
| Good;Sloppy. | — |

**Domain strings:** `www.kamaunegasi.net`, `kamaunegasi.net`, `kamaunegasi` (handles only where already used).  
**Forbidden:** fuzzy matches, autocorrect, third-party artist/label conflation, renaming house projects for “clarity.”

## Zero-error rules

1. Fail closed on name drift, 18+ gate breakage, broken media embeds, or deploy config regressions.
2. No silent catalog mutations — every ingest must cite source URL + target `CatalogItem.id`.
3. No new dependencies without security review.
4. Parallel agents must not edit the same file without a declared owner (see RUNBOOK).
5. Verifier blocks merge if any prior agent reports `FAIL` or unresolved `BLOCKER`.
6. Prefer surgical diffs; do not restyle unrelated surfaces.

---

## Agents

### `security`

| | |
|---|---|
| **Mission** | Threat-model changes; lock down APIs, embeds, env, and deps. |
| **Inputs** | Diff; `src/app/api/**`; `next.config.ts`; `package.json`; oEmbed/feed allowlists. |
| **Outputs** | `security-report.md` — findings (`PASS`/`FAIL`), CVE/dep notes, required fixes. |
| **Handoff** | Wave A (parallel). Feeds `cloudflare-deploy`, `verifier`. |

### `performance`

| | |
|---|---|
| **Mission** | Keep boot, stream deck, and feed paths fast; avoid layout thrash and heavy client bundles. |
| **Inputs** | Diff; `src/components/**`; route loaders; images/media usage. |
| **Outputs** | `perf-notes.md` — budgets touched, regressions, fix list. |
| **Handoff** | Wave A (parallel). Feeds `qa-browser`, `verifier`. |

### `ux`

| | |
|---|---|
| **Mission** | Preserve terminal composition: brand-first hero, one job per section, motion with purpose. |
| **Inputs** | Diff; design tokens/CSS vars; `Hero`, `AppShell`, player, footprint, magazine. |
| **Outputs** | `ux-checklist.md` — composition pass/fail, CTA clarity, mobile first-viewport. |
| **Handoff** | Wave A (parallel). Feeds `qa-browser`, `a11y`, `verifier`. |

### `catalog-names`

| | |
|---|---|
| **Mission** | Enforce exact-name policy across catalog, magazine, identity, UI copy, and metadata. |
| **Inputs** | Diff; `src/data/identity.ts`; `src/data/catalog.ts`; `src/data/magazine.ts`; user-facing strings. |
| **Outputs** | `names-audit.md` — every mismatch + required exact replacement. |
| **Handoff** | Wave A (parallel). Feeds `content-ingest`, `verifier`. |

### `content-ingest`

| | |
|---|---|
| **Mission** | Add/update catalog + magazine entries from approved house sources only. |
| **Inputs** | Source URLs; platform ids from `PLATFORMS`; taxonomy ids; existing `CATALOG` / `MAGAZINE_ISSUES`. |
| **Outputs** | Patch to data files + `ingest-log.md` (id, brand, platform, URL). |
| **Handoff** | Wave A when content changes; after `catalog-names` if both run. Feeds `compliance-18plus`, `verifier`. |

### `compliance-18plus`

| | |
|---|---|
| **Mission** | Ensure 18+ gate, age copy, and restricted-content labeling stay intact. |
| **Inputs** | Diff; gate/boot UI; `SITE.description`; legal/footer copy. |
| **Outputs** | `compliance-18plus.md` — gate path verified; copy exactness. |
| **Handoff** | Wave A (parallel). Feeds `qa-browser`, `verifier`. |

### `a11y`

| | |
|---|---|
| **Mission** | Keyboard, focus, labels, contrast for terminal UI and media controls. |
| **Inputs** | Diff; interactive components; command bar; player dock; magazine reader. |
| **Outputs** | `a11y-report.md` — WCAG-oriented issues + fixes. |
| **Handoff** | Wave A (parallel); coordinate with `ux`. Feeds `qa-browser`, `verifier`. |

### `analytics-bounce`

| | |
|---|---|
| **Mission** | Reduce bounce risk: clear first action, fast meaningful paint, no dead CTAs or broken play paths. |
| **Inputs** | Diff; hero CTA; stream entry; footprint → player handoff; error empty-states. |
| **Outputs** | `bounce-risk.md` — friction points + ranked fixes. |
| **Handoff** | Wave A (parallel). Feeds `qa-browser`, `verifier`. |

### `qa-browser`

| | |
|---|---|
| **Mission** | Manual/scripted browser verification of critical paths on desktop + mobile widths. |
| **Inputs** | Running app; reports from `ux`, `a11y`, `performance`, `compliance-18plus`, `analytics-bounce`. |
| **Outputs** | `qa-browser.md` — path matrix (`PASS`/`FAIL`), screenshots/recordings when UI changes. |
| **Handoff** | Wave B. Feeds `verifier`. |

### `cloudflare-deploy`

| | |
|---|---|
| **Mission** | Keep Pages/Workers config valid for `www.kamaunegasi.net`. |
| **Inputs** | Diff; `wrangler.toml`; `next.config.ts`; build scripts; env/domain notes in README. |
| **Outputs** | `deploy-check.md` — build command, adapter notes, domain/DNS sanity. |
| **Handoff** | Wave C after Wave A security/perf when deploy-touched. Feeds `verifier`. |

### `verifier` (always last)

| | |
|---|---|
| **Mission** | Merge gate: reconcile all agent outputs; confirm zero-error + exact-name policy. |
| **Inputs** | Full diff + every prior agent report. |
| **Outputs** | `verify-verdict.md` — `MERGE_OK` or `MERGE_BLOCKED` with residual blockers. |
| **Handoff** | Wave D — **never parallel with others; never skipped on PR.** |

---

## Handoff order (canonical)

```
Wave A (parallel, trigger-gated):
  security · performance · ux · catalog-names · content-ingest ·
  compliance-18plus · a11y · analytics-bounce

Wave B:
  qa-browser

Wave C (if deploy/config touched):
  cloudflare-deploy

Wave D (always):
  verifier
```

Machine-readable mirror: [`squad.json`](./squad.json).  
Invocation matrix: [`RUNBOOK.md`](./RUNBOOK.md).
