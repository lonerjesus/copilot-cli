# E2E elite gate

## Pillars
| Suite | Role |
|-------|------|
| `qa:av` / `qa:media-ref` / `qa:media-meta` | Units |
| `qa:smoke` | Auth, anti-scrape, SEO doors, commerce |
| `qa:media-range` | Range / `X-KN-Media` / integrity |
| `qa:av-e2e` / `qa:edit-save` | Admin upload + edit |
| `qa:writing-open` | Readable catalog units |
| `qa:guest` | Non-owner journey |
| `qa:player-blob` | Browser dock blob EOF |

## Entry
```bash
BASE=http://127.0.0.1:3040 ADMIN_EMAIL=<server-admin> ADMIN_PASS=… npm run qa:gate
```

## Contracts
- Client `ADMIN_EMAIL` **must** match server `ADMIN_EMAIL` (`isAdmin === true`).
- UA = `KN-QA/1.0` for API; real Chrome UA for Playwright (never `playwright` in UA).
- Shared helpers: `scripts/qa/lib.mjs`
