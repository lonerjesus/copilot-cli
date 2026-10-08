# house-atlas — expert incorporation surface

**Agents:** `ux` · `catalog-names` · `content-ingest` · `security` · `a11y` · `performance` → `qa-browser` → `verifier`  
**Branch:** `cursor/house-atlas-560e`

## Delivered

| Surface | Detail |
|---------|--------|
| **House nav** | Rail view `#house` (+ `#connections` / `#projects`) with brand-first atlas hero |
| **Panels** | One-job tabs: outlets · projects · archive · marks (keyboard arrows) |
| **Lanes** | Underline segment filter (not pill cluster) — writing/audio/video/live/archive/web |
| **Outlets** | Full map incl. YouTube, FaustSociety, MagCloud, Shazam ×2; primary outlets featured |
| **Projects** | TSOL, Imponderabilia, STPK lounge, Good;Sloppy., QTOASS, Faust Society — exact names; lane-aware |
| **Archive bridge** | Live MagCloud + Substack RSS via `/api/connections` with posters/summaries (off Netflix shelves) |
| **Marks** | Brand/artist/handle strip from `ALIASES` (list, not card dump) |
| **Look** | Phosphor/amber atmosphere, drifting grid, dual orbs, staggered rise, CTA pair |
| **Code** | Dynamic import keeps MagCloud strings off initial home HTML; session-gated API; 8s feed timeout |

## Probe follow-up ([Hunt in-repo connections](bc-2cd19268-083d-5141-8b4e-e40f0cdf7975) · [Probe live platform links](bc-8cb13641-8208-5248-a6a2-66839c166627))

| Finding | Action |
|---------|--------|
| `kamaunegasi.me` parked (AboveDomains) | Atlas lane → archive; blurb warns prefer `.net` |
| MagCloud QTOASS Vol.1/2 still live | Archive outlets `magcloud-qtoss-vol1/2` + project links |
| MagCloud off stream | Kept out of `PLATFORMS` ingest; smoke forbids |
| Substack/Apple/Twitch/Vimeo/ToneDen live | Already Atlas outlets + primary featured set |
| Empty catalog seeds | Future stream re-seed — not in this PR |

## Verifier

`MERGE_OK` — local smoke 54/54; House is the incorporation hub.
