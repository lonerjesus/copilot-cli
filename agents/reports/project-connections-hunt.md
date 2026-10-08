# Project connections hunt — incorporate into kamaunegasi.net

**Agents:** `content-ingest` · `catalog-names` · `cloudflare-deploy` → `verifier`  
**Branch:** `cursor/project-connections-hunt-560e`  
**Date:** 2026-10-08  
**Verdict:** `PLAN_READY` (no product merge required — inventory + roadmap)

---

## Scope of the hunt

| Surface | Result |
|---------|--------|
| This repo (`lonerjesus/copilot-cli`) + git history | Full platform map, MagCloud seed refs, old Footprint ticker |
| GitHub `lonerjesus/*` | **14 repos — all forks except `skills`**. No old site / MagCloud CMS source in accessible GitHub |
| Live HTTP probes of `PLATFORMS` + discovered URLs | Status table below |
| Public web search | Substack TSOL live; Faust Spirit GoDaddy; Apple/Podchaser podcasts; MagCloud QTOASS still public |

**Not accessible from this agent:** private GitHub orgs, Apple ID / Bandcamp / MagCloud dashboards, Cloudflare DNS outside this Worker, phone backups, GoDaddy registrar panels, Instagram DMs.

---

## House identity (exact names — do not “correct”)

From `src/data/identity.ts` — incorporation must keep these spellings:

| Kind | Names |
|------|--------|
| Legal | Kendrick Tirrell Herring · Kendrick-Kamau Negasi · Kamau Salaam Nasser |
| Artist | Streetpolitik · Faust Fakeway |
| Brand | GrownAssKids (GAK) · Black Oh-My · GRUNGEzhou · GRUNGEzhou Supply · Golden Crow · 30over9 |
| Entity | BLKDTY Music LLC · Kendrick-Kamau Negasi LLC · Golden Crow Acquisitions |
| Handle | Thelonious1 (TL1) · 357Itsumi |
| Project | Telling Show Of Love (TSOL) · Telling Stills Of Love · Imponderabilia: Wall_Carpet 235 · LoveDrugVendingMachine · GRUNGEzhou Libellus · STPK's Smoker's Lounge Music · Telling Songs As Content · Good;Sloppy. |

---

## Live connection matrix

| Connection | URL | Probe | Role on kamaunegasi.net |
|------------|-----|-------|-------------------------|
| **House site** | www.kamaunegasi.net | 403 bot / live app | Canonical hub |
| **Legacy .me** | www.kamaunegasi.me → ww38… | Parked / dead | Redirect DNS → .net when you control it |
| **TSOL Substack** | tellingshowoflove.substack.com (+ `/feed`) | 200 · RSS ~5 items | Writings ingest / Footprint bridge |
| **Bandcamp 357Itsumi** | 357itsumi.bandcamp.com | 200 (bot 403 sometimes) | Music mirror / link-out |
| **Good;Sloppy.** | …/album/30over9-presents-good-sloppy | 200 | Music shelf node |
| **SoundCloud** | m.soundcloud.com/357itsumi | 200 | Audio embed path exists |
| **Slushy** | slushy.com/357Itsumi | 200 | Link-out / optional ingest |
| **Shazam 357 / Streetpolitik** | shazam.com/artist/… | 403 bot | Link-out only |
| **Facebook 357Itsumi** | facebook.com/…61566165809486 | 200 | Link-out |
| **Rumble** | rumble.com/user/357Itsumi | 403 bot (may still be live) | Video link-out |
| **Apple · Imponderabilia** | podcasts.apple.com/…/id1831912721 | 200 | Podcast bay |
| **Apple · STPK's Smoker's Lounge** | …/id1110276220 | 200 | Podcast bay |
| **Twitch · kamaunegasi** | twitch.tv/kamaunegasi | 200 | Live embed already supported |
| **Twitch · FaustSociety** | twitch.tv/FaustSociety | 200 | **Missing from PLATFORMS** — add |
| **Vimeo · streetpolitik** | vimeo.com/streetpolitik (shows 357Itsumi) | 200 | Video archive |
| **ToneDen** | toneden.io/streetpolitk | 200 | Link-out (typo handle preserved) |
| **YouTube @KamauNegasi** | youtube.com/@KamauNegasi | 200 | **Missing from PLATFORMS** — add |
| **Instagram mars.herrlove** | instagram.com/mars.herrlove | login wall | Link-out; Faust site footer |
| **my.bio Kendrick-Kamau** | my.bio/Kendrick-Kamau | 200 | Link tree → absorb into House bay |
| **Faust Spirit Social Society Inc.** | faustspiritsocialsocietyincorp.godaddysites.com | 200 Under Construction | Soft-land or redirect plan |
| **GrungeDaddyIchiban** | grungedaddyichiban.us | 200 (thin page) | Linked from TSOL episode — decide brand home |
| **MagCloud · streetpolitik** | magcloud.com/user/streetpolitik | 200 | Archive only (removed from stream by design) |
| **QTOASS Vol.1** | magcloud.com/browse/issue/665683 | live RSS | Writings archive / optional paid reprint |
| **QTOASS Vol.2** | magcloud.com/browse/issue/672460 | live RSS | Same |
| **tipon.com** | tipon.com → parking | dead | Drop or reclaim DNS |
| **streetpolitik.com / .info** | NXDOMAIN / dead | dead | Reclaim or leave; MagCloud still cites .info |
| **grownasskids.com / grungezhou.com** | dead | dead | Reclaim if brand-critical |

---

## GitHub connections

Accessible `lonerjesus` repos are **tooling forks** (claude-mem, OpenCut, cloudflare-os, …) plus `skills`.  
**No old kamaunegasi / Streetpolitik / MagCloud site codebase** was found on GitHub.

Implication: incorporation is **content + DNS + platform bridges**, not a repo merge of a prior CMS.

---

## Ticker finding (answered)

The “ticket that ran across the top” in the **first house build** (`f32d10c`) was **not** an admin CMS ticket.

It was `FootprintFeed`’s `.footprint__ticker`: an auto-scrolling strip of **platform pulses** (`relativePulse · platformLabel · title`). CSS remains; the Feed UI was later removed from the member shell.

**Current:** Admin → Data → **Site ticker** (manual announcement under 18+).  

**Optional later:** restore a “pulse ticker” mode that mirrors Footprint/RSS headlines again.

---

## MagCloud / QTOASS (intentionally stripped)

Removed from member stream in MagCloud purge PRs (`d398504` / related). MagCloud **still hosts**:

- VOL. 1 — *EVIL ACCORDING TO ANGLO-SAXON JESUS.* (24 pp, 2013)  
- VOL. 2 — *AWAKENING FROM NIGHT TERRORS TO REALITY* (30 pp, 2013)  
- Magazine id `665724`, user `streetpolitik`, RSS feed live  

**Incorporation options (pick one):**

1. **Archive bay** — Footprint / Writings · Nonfiction with external MagCloud link + posters (no auto-seed on Netflix shelves)  
2. **House reprint** — upload PDF/pages as paywalled writing with original titles (exact allows)  
3. **Leave external** — keep off .net; link from House identity only  

---

## Incorporation roadmap (phased)

### Phase A — Hub completeness (low risk)

1. Add missing platforms to `PLATFORMS`: YouTube `@KamauNegasi`, Twitch `FaustSociety`, Faust Spirit GoDaddy, MagCloud archive (kind `web`/`blog`), Instagram if you want it public.  
2. House bay UI: aliases + platforms as browsable identity (no MagCloud auto-play).  
3. DNS: point `kamaunegasi.me` → `www.kamaunegasi.net` when registrar access exists.  
4. Decide fate of dead brand domains (GAK, GRUNGEzhou, tipon, streetpolitik.*).

### Phase B — Content bridges

1. **Writings** — Substack RSS → admin “import to notes” (already feed-capable) + optional QTOASS archive cards.  
2. **Music** — Bandcamp / SoundCloud / Good;Sloppy. / ToneDen as fetched Footprint or curated house uploads.  
3. **Podcasts** — Imponderabilia + STPK Smoker's Lounge as audio shelves (Apple → house file or embed).  
4. **Video** — Vimeo streetpolitik + Rumble + YouTube as video shelf / Footprint.  
5. **Live** — Twitch kamaunegasi (+ FaustSociety as alt channel).

### Phase C — Society / brands

1. Faust Spirit: either finish GoDaddy → redirect to .net `/house#faust`, or light “Society” page on .net.  
2. GrungeDaddyIchiban.us: brand page or merge under GRUNGEzhou / TSOL.  
3. 30over9 / Good;Sloppy. / Black Oh-My / GAK: brand tiles → filtered catalog tags (already taxonomy-ready).

### Phase D — Ops

1. Optional R2 for large multi-project media (512 MB chunked path already live).  
2. Pulse ticker mode (Footprint-style) vs announcement ticker (current).  
3. Exact-name CI gate on any new platform labels.

---

## Priority picks (recommendation)

| Priority | Action | Why |
|----------|--------|-----|
| P0 | Confirm DNS for `.me` + Faust/Twitch/YouTube add to PLATFORMS | Hub completeness |
| P1 | Substack → Writings import workflow | Active publishing surface |
| P1 | Bandcamp + Good;Sloppy. curated music nodes | Strongest AV assets |
| P2 | MagCloud QTOASS as Writings archive (opt-in) | History without polluting Netflix shelves |
| P2 | Podcast pair (Imponderabilia + STPK) | Apple already linked |
| P3 | Dead domain reclaim / Faust Society page | Brand cleanup |

---

## Gaps / next asks for you

1. Registrar access for `.me`, tipon, streetpolitik.*, GAK, GRUNGEzhou?  
2. Prefer MagCloud **link-out** vs **house reprint** for QTOASS?  
3. Should FaustSociety Twitch / YouTube appear on the public House bay?  
4. Any **private** repos or Drive folders with the old site source (ticker CMS)? Not on public GitHub.

---

## Verifier

`PLAN_READY` — hunt complete for accessible surfaces; no code product change required to accept this plan. Follow-up PRs implement Phase A+ when you choose priorities.
