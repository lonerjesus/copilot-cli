# qa-browser

**Agent:** qa-browser  
**Verdict:** PASS

## Path matrix

| Path | Result |
|------|--------|
| Home 200 | PASS |
| `/api/feed` | PASS |
| `/api/ingest` | PASS |
| `/robots.txt` | PASS |
| `/sitemap.xml` | PASS |
| oEmbed foreign deny (400) | PASS |
| Ingest exact 357Itsumi / Streetpolitik | PASS |
| 18+ marker in HTML | PASS |
| Lint (`npm run lint`) | PASS |

Script: `bash scripts/qa-smoke.sh http://localhost:3000` → 10/10.
