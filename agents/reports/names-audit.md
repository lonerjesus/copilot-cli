# names-audit — catalog-names

**Agent:** `catalog-names`  
**Branch:** `cursor/netflix-house-stream-560e`  
**Scope:** diff vs `origin/main` — especially `src/data/catalog.ts`, `AdminStation`, `StreamDeck`, `Hero`, `AppShell`, `README`  
**Sources of truth:** `agents/ROSTER.md` · `src/data/identity.ts` (`ALIASES`, `PRIMARY_NAME`, `BIRTH_NAME`, `SITE`)

## Verdict: **FAIL**

Delta introduces **no new** house-name drift. Two **pre-existing** fuzzy blurbs remain in `src/data/catalog.ts` (CATALOG seed untouched by this PR’s STREAM_ROWS rewrite). Fail closed on name drift.

---

## Mismatches (required replacements)

| File | Loc | Found | Exact replacement |
|------|-----|-------|-------------------|
| `src/data/catalog.ts` | `tsol-celine` blurb | `wall carpet` | `Wall_Carpet` (canonical project fragment of `Imponderabilia: Wall_Carpet 235`) |
| `src/data/catalog.ts` | `golden-crow` blurb | `the Negasi portfolio` | `the Kendrick-Kamau Negasi portfolio` |

### Patch strings

```diff
- blurb: "Imponderabilia transmission — wall carpet frequency opening.",
+ blurb: "Imponderabilia transmission — Wall_Carpet frequency opening.",

- blurb: "Golden Crow house node — acquisitions frequency under the Negasi portfolio.",
+ blurb: "Golden Crow house node — acquisitions frequency under the Kendrick-Kamau Negasi portfolio.",
```

---

## Diff surfaces checked — clean

| Surface | Result | Notes |
|---------|--------|-------|
| `STREAM_ROWS` rewrite | PASS | Generic shelves (`FEATURED` / `VIDEOS` / `MUSIC` / `PHOTOS` / `READING`); pinned `qtoss-vol1`/`qtoss-vol2` keep exact brands |
| All `brand:` fields in `CATALOG` | PASS | Every brand ∈ ROSTER / `ALIASES` |
| `AdminStation` | PASS | Default brand `Telling Show Of Love`; domain placeholder `www.kamaunegasi.net` |
| `StreamDeck` / `Hero` / `AppShell` | PASS | Brands via data / `SITE.title` / `SITE.domain`; no invented names |
| `README` roster line | PASS | Exact spellings + allowed shorts (`GAK`, `TL1`, `TSOL`) |
| `layout.tsx` metadata | PASS | Authors/keywords use canonical forms (viewport-only delta) |
| AliasMatrix removal | PASS | Removes Names bay; does not alter identity source of truth |

### Allowed / not mismatches

- Title `imponderabilia: wall_carpet #235` — documented published form in `ALIASES` note; `brand` is canonical `Imponderabilia: Wall_Carpet 235`
- Subtitle `TheloniousOne` — documented note for `Thelonious1`
- `™` on Streetpolitik / TSOL — trademark mark on exact stem
- Code comments / agent report using “Netflix” as UX-pattern metaphor — not house-name conflation
- Tag shorthand `BLKDTY` / `GAK` / `TSOL` / `TL1` — shorts or stem tags; entity `brand` fields use full canonical where required

---

## Handoff

- **content-ingest / fixer:** apply the two blurb replacements above  
- **verifier:** block merge until FAIL cleared (or residual waived with documented exception)
