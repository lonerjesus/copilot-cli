# Hotfix — landing ▶ Pause + NO SIGNAL

**Branch:** `cursor/fix-landing-play-nosignal-05af`  
**Base:** `main` @ `b4f55fc`

## Bug
Hero `toggle()` on empty queue → `playing=true`, `current=null` → Pause + DECK idle + NO SIGNAL.

## Fix
- `fetchPlayableHouse` + `enterStream({ forcePlay })` on hero + idle dock
- Newest-first queue (latest AV, then older)
- Toggle refuse empty; clear `playing` when no current

## Note
Full stack remains #44. This PR is the thin prod unblocker.
