# GitHub best-build OODA — stack vs open PRs

**Tip:** `cursor/stack-play-batch-elite-05af` → PR #44  
**Base:** `main` @ `b4f55fc` (#43 queue squash)

## OBSERVE

| PR | Theme | CI | In stack? | Ship via |
|----|-------|-----|-----------|----------|
| #44 | Integration stack | building | — | **merge this** |
| #43 | Play Next index | green | yes (on main) | already merged |
| #42 | Hero ▶ AV | green | yes | supersede |
| #41 | Batch ZIP albums | green | yes | supersede |
| #40 | Elite resume/CONTINUE | green | yes | supersede |
| #39 | AV-only dock | green | yes | supersede |
| #36 | DeckArt logo/art | green | yes | supersede |
| #35 | nine GitHub tools | conflict | no | out of scope (docs/tools) |
| #29 | connections hunt | docs | no | docs-only later |
| #20 | admin nav copy | conflict | no | rebase separately |
| #9 | cloud agent env | docs | no | docs-only later |

## ORIENT

Best production build = **#44 only**. Sibling drafts are subsets; merging them after #44 risks StreamDeck / PlayerDock thrash. Stale docs PRs do not improve player/batch.

## DECIDE

1. Keep shipping on #44; close #36/#39/#40/#41/#42 after merge.
2. Hero ▶ must **forcePlay**, not toggle-pause.
3. Gate must include stack unit checks: playback-memory + collection-zip.
4. Boot finish once-only (already landed) so overlay cannot trap ▶.

## ACT

- AppShell hero → `playItem(..., { forcePlay: true })`
- `qa-gate.sh` + playback-memory + collection-zip
- Verifier: MERGE_OK pending tip CI

## REDTEAM

- Do **not** fold #35/#20 into this stack (conflicts, wrong surface).
- Local `qa:hero-play` needs `ADMIN_EMAIL` matching server admin; Workers preview is SoT for e2e.
- Production deploy still separate from CI green on preview branch.
