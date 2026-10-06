# admin-upscale-audit — R2 media + Tumblr-style admin

**Agents (roster):** `security` · `a11y` · `ux` · `catalog-names` · `code-checker` → `verifier`  
**Branch audited:** `cursor/r2-media-upload-560e` @ `1207f2f`  
**Surfaces:** `AdminStation.tsx`, `api/admin/**`, `api/analytics/**`, `api/media/**`, `media-store` / `analytics-store` / `content-store.updateUpload`, admin CSS in `globals.css`  
**Exact-name policy:** house spellings only (source `src/data/identity.ts`). No third-party agent identities invented.  
**Verdict:** `MERGE_BLOCKED` until must-fixes land.

---

## Summary

Compose/library/analytics/data tabs are a solid Tumblr-style owner flow. Admin APIs gate on `isAdminEmail`; media type/size limits and `house/` key guards are sound; `updateUpload` re-runs `validateCreateInput`. Blockers are **exact-name brand free-text**, **drop-zone a11y while busy**, **no client preflight on upload**, and **mobile library row layout**. Media binary route is session-only (stream model) — WARN, not blocker, if paywall remains “save/download only.”

---

## Findings

| ID | Area | Status | Finding |
|----|------|--------|---------|
| A1 | catalog-names | **FAIL** | Brand is free-text (`AdminStation` advanced). Drift like “Grown Ass Kids” / “TSOL” expands break exact-name policy. Default `Telling Show Of Love` is correct. |
| A2 | a11y | **FAIL** | Drop zone: no `aria-busy` / `aria-disabled` while `busy`; clicks still open file picker mid-upload. Hidden input uses `pointer-events: none` inside `role="button"` — poor control association for AT. |
| A3 | ux / easy upload | **FAIL** | No client-side type/size check before POST. Failures for `invalid_type` / `file_too_large` only after network; 95 MiB limit is opaque in UI. |
| A4 | ux / mobile | **FAIL** | `.admin__library-list li` stays horizontal; title + edit/remove crowd ≤480px. Tabs wrap OK; recent-signal grid stacks at 720px (PASS). |
| S1 | security / admin APIs | **PASS** | `/api/admin/content|media|stats` require session + `isAdminEmail`; fail-closed if `ADMIN_EMAIL` empty. `Cache-Control: no-store`. |
| S2 | security / media GET | **WARN** | `/api/media/*` any signed-in member; catalog exposes `src`. Matches “paywall save / download” + member stream, but raw bytes bypass purchase. Path: `house/` + `..` reject **PASS**. |
| S3 | security / analytics | **PASS** | POST requires auth; `ALLOWED` signal set drops junk. Admin-only summarize via `/api/admin/stats`. |
| S4 | security / stores | **PASS** | `validateUploadFile` allowlist + `MAX_MEDIA_BYTES`; `newHouseObjectKey` UUID; `updateUpload` merges then `validateCreateInput` (https URLs, taxonomy, embed allowlist). |
| S5 | security / orphans | **WARN** | Compose uploads to R2 before publish; abandoned drafts leave objects (delete cleans published URLs only). |
| U1 | ux / compose | **PASS** | Presets Video/Photo/Music/Note, drop→auto kind/title/src, advanced collapse, publish→library. Terminal tone preserved. |
| U2 | ux / copy | **WARN** | Lead cites “Tumblr / Substack” (Substack is a house platform uplink; Tumblr is metaphor only). Prefer house-native phrasing. |
| U3 | a11y / tabs | **PASS** | `aria-label="Admin tools"`, `aria-current="page"`, presets `aria-pressed`, errors `role="alert"`. |
| C1 | code-checker | **PASS** | `createUpload` always `source: "uploaded"`; paywall orthogonal. PATCH + DELETE wired. |
| C2 | CSS | **PASS** | Drop zone focus-visible phosphor, compose max-width, auto-fit stats/data grids. Duplicate 640/720/900 row breakpoints — residual only. |

---

## Must-fix (only)

### 1. Brand select from `ALIASES` (A1)

In `AdminStation` advanced form, replace free-text brand `<input>` with `<select>` options = exact `ALIASES[].name` (display `short` in parentheses only where roster allows: GAK, TL1, TSOL). Keep default `Telling Show Of Love`. Reject unknown brands server-side in `validateCreateInput` against the same list.

### 2. Drop zone a11y + busy lock (A2)

- Prefer `<label class="admin__drop" htmlFor={id}>` wrapping or controlling the file input (drop `role="button"` + nested inert input).
- Set `aria-busy={busy}`, disable input when `busy`, ignore click/drop while uploading.
- Keep keyboard activation + visible `:focus-visible` ring.

### 3. Client upload preflight (A3)

Before `fetch("/api/admin/media")`, mirror `ALLOWED_TYPES` + `MAX_MEDIA_BYTES` (import constants from `media-store` or a shared `media-limits` module). Surface `file_too_large` / `invalid_type` in the drop hint immediately. Show max size in `admin__drop-hint` (e.g. “up to 95 MB”).

### 4. Mobile library stack (A4)

In `globals.css` `@media (max-width: 480px)`:

```css
.admin__library-list li {
  flex-direction: column;
  align-items: stretch;
}
.admin__library-actions {
  justify-content: flex-end;
}
.admin__tab {
  min-height: 2.5rem;
}
```

---

## Residual (do not block if product accepts)

| Item | Note |
|------|------|
| S2 media bytes | If purchase must gate file possession, require `purchasedCatalogIds` (or admin) on GET `/api/media` and use short-lived signed URLs for the player. |
| S5 orphans | GC unreferenced `house/*` keys or defer R2 put until publish. |
| U2 copy | e.g. “Drop a file to publish — compose, library, analytics, export.” |
| Upload progress | `XMLHttpRequest` / fetch progress for large videos — nice-to-have after A3. |
| Analytics rate | Global middleware 120/min; optional tighter `/api/analytics` bucket. |

---

## Agent checklist (this audit)

| Agent | Output role | Result |
|-------|-------------|--------|
| `catalog-names` | exact brands in compose | **FAIL** A1 |
| `a11y` | drop zone / tabs | **FAIL** A2 |
| `ux` | easy upload + mobile | **FAIL** A3, A4 |
| `security` | admin / media / analytics | **PASS** (+ WARN S2/S5) |
| `code-checker` | updateUpload / source | **PASS** |
| `verifier` | merge gate | **MERGE_BLOCKED** until A1–A4 |

---

## Out of scope / not invented

No third-party agent names. House names checked against roster table; default brand and catalog seeds use exact spellings (`Telling Show Of Love`, `357Itsumi`, `Streetpolitik`, etc.).
