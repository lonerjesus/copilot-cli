# perf-notes — elite player/site upgrade

**Agent:** `performance`  
**Verdict:** PASS

- Resume writes throttled (1200ms) + force on scrub end.
- CONTINUE listens to `kn-resume` / focus — no progress-tick re-render of StreamDeck.
- Media Session effect scoped to current/playing changes.
- No new client bundles or heavy deps.
