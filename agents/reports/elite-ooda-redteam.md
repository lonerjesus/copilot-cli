# Elite upgrade — OODA · redteam · 10× (www.kamaunegasi.net)

**Branch:** `cursor/elite-player-site-05af`  
**Source domain:** `www.kamaunegasi.net` (user said `.com` — canonical house domain is **`.net`**)  
**Mode:** `/human` `/meta` `/redteam` `/10xthink` `/ooda`

## OBSERVE

House already ships a serious autonomous stack: terminal shell, age gate, account wall, fixed Spotify-class dock, Netflix-style shelves, Substack-like writing enlarge, iPhone Photos gallery, House Atlas outlets (Telling Show Of Love, Bandcamp · 357Itsumi, Twitch, YouTube, Vimeo — no invented Instagram/Kick/OnlyFans/Spotify handles), Stripe paywall downloads, first-party analytics.

Prior E2E (`platform-compare-e2e`) rated Spotify / Apple TV / Substack / Instagram patterns **Strong** with intentional gaps (lyrics, Stories, on-site email subscribe, cross-device continue).

## ORIENT (compete ≠ clone)

| Platform | Steal the *job* | Reject the *skin* |
|----------|-----------------|-------------------|
| Spotify | Instant transport, Up Next, OS media keys, volume, resume listening | Playlist social graph, lyrics pane, For You ML clone |
| Substack | Enlarge reader, share, related, paywall, TSOL bridge | Fake newsletter CMS / email blast clone |
| X / Meta | Chronic footprint of *owned* outlets | Fake posts, replies, Stories, Reels, invented accounts |
| Netflix / Apple TV | CONTINUE rail + theater deck | Cross-device sync + franchise UI chrome |

**10× thesis:** Win as the sovereign house OS for Kendrick-Kamau Negasi, LLC — Streetpolitik · GrownAssKids · Telling Show Of Love · GRUNGEzhou — not as a thinner Spotify. Retention compounds from resume + transport + readable depth.

## DECIDE (this PR)

Ship the highest-leverage cluster with **no new deps**:

1. Same-device playback memory (`src/lib/playback-memory.ts`)
2. CONTINUE stream rail
3. Media Session API (lock screen / headset)
4. Global Space + Shift+arrows transport
5. Dock volume + mute
6. Writing share + related + Telling Show Of Love outlet link

## ACT (shipped)

See code diff on this branch. QA: `npm run qa:playback-memory` + `qa:platform-compare` + smoke.

## REDTEAM (what still loses)

| Attack | Severity | Mitigation path |
|--------|----------|-----------------|
| Cross-device CONTINUE empty after phone→laptop | High retention | Optional AUTH_KV resume map keyed by user id (PR2) |
| Queue not reorderable / no shuffle-repeat | Medium Spotify gap | Modes in PlayerContext (PR2) |
| Footprint is archive grid, not pulse timeline | Medium “X feel” | Optional chronological pulse view — still house floppy aesthetic |
| No on-site email subscribe | Medium Substack | Deep-link + optional embed of TSOL only — never invent list |
| Personalization unused (`topPlayed` admin-only) | Medium Meta/Spotify | FOR YOU rail from first-party signals (PR2) |
| CommandBar orphaned (not in AppShell) | Low | Remount slim `kn$` strip below ticker without hero clutter |
| Anti-scrape / account wall hurts cold SEO | Intentional | Keep; `/access` share cards already optimized |
| Invented social clones for “parity” | Critical brand risk | **Forbidden** — exact-name + real outlets only |

## Wave status

Wave A: security · ux · a11y · performance · catalog-names · analytics-bounce · code-checker · compliance-18plus  
Wave B: qa-browser  
Wave D: verifier
