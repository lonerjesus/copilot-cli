# Platform comparison E2E — expert verdict

**Branch:** `cursor/expert-tier-harden-560e`  
**Date:** 2026-10-08  
**Prod server:** `next start` :3025 (dev CSP `unsafe-eval` breaks React handlers — prod is the truth)

## Suites

| Suite | Result |
|-------|--------|
| `qa:platform-compare` | **27/27** |
| `qa:writing-open` | **15/15** |
| `qa:media-range` | **30/30** |
| `qa:edit-save` | **15/15** |
| `qa:smoke` | **60/60** |
| `build:next` | green |
| `tsc --noEmit` | green |

Artifacts: `/opt/cursor/artifacts/platform-compare/` (`01-fixed-dock` … `04-house-atlas`, `matrix.json`)

## Platform matrix

| Platform | Parity | Evidence | Gap (intentional / backlog) |
|----------|--------|----------|-----------------------------|
| **Spotify** | Strong | Fixed hover dock, autoplay on/off, Up Next, Range/seek AV | No lyrics / social listening |
| **Apple TV / Netflix / Disney+** | Strong | Stream shelves, browse rails, theater deck | No cross-device continue-watching |
| **Instagram / iPhone Photos** | Strong (new) | `PhotoGallery` — full-bleed, swipe, pinch, double-tap zoom, pull-down dismiss, filmstrip | No Stories / Reels |
| **Substack** | Strong | Writing enlarge lightbox + body + paywall | No on-site email subscribe |
| **Twitch** | Present | Embed player + atlas outlet | — |
| **Kick** | Absent | Not invented | Add only with a real house handle |
| **X / Twitter** | Absent | Not first-class | Link-out only if owned |
| **MySpace** | Absent | Legacy irrelevant | — |
| **OnlyFans** | Absent | Not invented | Paywall commerce is Stripe house downloads, not OF clone |
| **Bandcamp / SoundCloud / YouTube / Vimeo / Apple Podcasts** | Present | Player embeds + House Atlas outlets | — |

## GitHub / connections updates

- Open product PR: [#34](https://github.com/lonerjesus/copilot-cli/pull/34) (this branch)
- Connections roadmap (docs): [#29](https://github.com/lonerjesus/copilot-cli/pull/29) — hunt complete; no fake Instagram/Kick/OF/Spotify accounts added
- House Atlas API `/api/connections` returns outlets/projects/archive bridges (Substack, Bandcamp, Twitch, YouTube, Vimeo, Apple, MagCloud archive links, Faust, etc.)
- `lonerjesus/*` GitHub org: mostly forks / skills — **no alternate production site source** to merge beyond this repo
- Recent mainline: expert admin Save / iOS URL trap (#33), upload persist (#32)

## Code shipped this pass

1. **iPhone-style `PhotoGallery`** for `kind: still` (swipe / pinch / double-tap / dismiss / strip)
2. Magazine context routes stills → gallery (writings → reader)
3. Fixed viewport player + autoplay pref (prior commit) verified in prod
4. Hash nav uses `location.hash` so deep-links sync
5. Autoplay initial state reads `localStorage` synchronously

## Agents

ux · a11y · catalog-names · security · analytics-bounce · code-checker → **verifier**

## Verifier input

`MERGE_OK` recommended for UX + E2E green on prod; remaining gaps are product scope (Kick/IG/OF accounts, Stories, continue-watching), not regressions.
