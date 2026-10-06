# bounce-risk

**Agent:** `analytics-bounce`  
**Branch:** `cursor/netflix-house-stream-560e` vs `origin/main`  
**Surfaces:** AppShell · StreamDeck · AdminStation · Hero · CommandBar · AuthContext kick · CategoryBrowser  
**Verdict:** FAIL

## First-action friction (ranked)

| Rank | Friction | Signal risk | Severity |
|------|----------|-------------|----------|
| 1 | Hero / Featured **stream** starts chapbook essays with no playable `src`/embed — dock opens, “play” feels empty until magazine | `enter_stream` fires but meaningful consume may not | **BLOCKER** |
| 2 | Netflix home shows only FEATURED + READING (2 items); VIDEOS / MUSIC / PHOTOS omitted → looks unfinished | Early exit from Stream bay | **BLOCKER** |
| 3 | Hero Footprint CTA still **`F:`** while rack / chips use **`E:`** — second CTA feels broken / mistyped | Misclick + lost trust | **HIGH** |
| 4 | AuthContext kick on missing/superseded session → instant `/access` with no explanation | Mid-session bounce; return path depends on AccessGate `next` | **HIGH** |
| 5 | House-only CategoryBrowser hides outside archive users may expect on home | Confusion unless Footprint CTA is crystal clear | **MED** |
| 6 | Empty stream only when `house.length === 0`; partial catalog has no “shelves filling soon” copy | Soft bounce | **MED** |

## What reduces bounce (already good)

| Signal / UX | Surface | Notes |
|-------------|---------|-------|
| `enter_stream` | Hero, featured, shelf tiles | Wired with `via` |
| `queue_next` | Tile `+ next` | New; supports Spotify-style continue |
| Command `next` / `queue` | CommandBar → AppShell | Expands dock / opens stream |
| Names bay removed | AppShell | Less chrome before stream |
| Hero commerce copy | “Member house stream · outside archive on Footprint” | Clear product split — if CTA letters match |
| Admin Video / Photo / Music presets | AdminStation | Shortens time-to-shelf content (ops, not visitor) |
| Stream empty copy | Only when fully empty | Correct wording; unused while essays exist |

## Dead / weak CTA matrix

| Control | Expected | Actual | Verdict |
|---------|----------|--------|---------|
| Hero `stream` | Start house AV stream | Queue = MagCloud essays → non-AV dock | DEAD-ISH |
| Featured “press play · queue follows” | Play media | Same essays | OVERCLAIM |
| Hero `F:` | Open Footprint archive | Link works (`/footprint`) but letter wrong vs E: | MISLABELED |
| Drive E FOOTPRINT | Outside archive | Works | PASS |
| Chip `E` | Footprint | Works | PASS |
| Chip `Q` queue | Focus stream / up next | Opens stream bay + expands | PASS |
| Browse house-only | House catalog | Thin until uploads | ACCEPTABLE if stream CTA honest |

## Auth kick bounce path

```
session missing / superseded
  → AuthProvider useEffect
  → router.replace("/access")
  → AccessGate (login/register)
```

- No toast / status before leave → users interpret as crash or lockout.
- One-login policy is correct for security; bounce cost needs a one-line reason on AccessGate.

## Must-fix (ranked)

1. **Play path:** Seed at least one house video or audio with `src`/embed for Featured + Hero queue, **or** route essay Featured/Hero CTA to magazine open instead of `playItem`.
2. **Empty shelves:** Show intentional empty VIDEOS / MUSIC / PHOTOS rows (one line each) **or** hide Netflix genre chrome until content exists — do not advertise a full shelf UI that vanishes three rows.
3. **Drive letter:** Hero `F:` → `E:`; Footprint page title `F: FOOTPRINT` → `E: FOOTPRINT`.
4. **Session kick copy:** `/access?reason=session` (or live status) so kick ≠ mysterious bounce.
5. Keep Footprint as the clear escape hatch for outside media (copy already good once letter matches).

## Analytics checklist (post-fix)

| Event | Still fire? |
|-------|-------------|
| `enter_stream` | yes — add `kind` / `playable` if distinguishing essay vs AV |
| `queue_next` | yes |
| `command` | yes (`next`, `queue`) |
| Session kick | consider `session_kicked` once copy lands |

**FAIL**
