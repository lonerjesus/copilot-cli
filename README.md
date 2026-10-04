# kamaunegasi.net

Autonomous portfolio + vlog platform for **Kendrick-Kamau Negasi**.

Futuristic terminal UI · streaming-style browse · chronic social footprint feed · custom audio/video deck that pulls posts from connected platforms.

## Stack

- Next.js (App Router) + TypeScript
- Terminal design system (CSS variables, no card-heavy chrome)
- `/api/feed` aggregates catalog + live Substack RSS
- `/api/oembed` proxies allowed platform oEmbed lookups
- `/api/ingest` audits house platforms against catalog (exact-name policy)
- First-party engagement signals in `src/lib/analytics.ts` (no third-party trackers)
- Ready for Cloudflare Pages (`wrangler.toml` · domain `www.kamaunegasi.net`)

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## QA smoke

```bash
bash scripts/qa-smoke.sh http://localhost:3000
# or
npm run qa:smoke
```

## Agent squad

See [`agents/ROSTER.md`](./agents/ROSTER.md) and [`agents/RUNBOOK.md`](./agents/RUNBOOK.md). Eleven cooperating specialists; **verifier always last**.

## Deploy on Cloudflare Pages

1. Connect this repo in Cloudflare Pages.
2. Build command: `npm run build`
3. Framework preset: Next.js (use OpenNext / Cloudflare Next adapter if enabling edge API routes).
4. Attach custom domain `www.kamaunegasi.net`.
5. Confirm `wrangler.toml` vars: `SITE_DOMAIN`, `EXACT_NAME_POLICY`, `AGE_GATE_REQUIRED`.

For a static-first preview, `npm run build && npm run start` works on any Node host.

## Identity nodes

Streetpolitik · GrownAssKids (GAK) · Black Oh-My · BLKDTY Music LLC · Kendrick-Kamau Negasi LLC · Thelonious1 (TL1) · Telling Show Of Love (TSOL) · Telling Stills Of Love · Imponderabilia: Wall_Carpet 235 · 357Itsumi · Faust Fakeway · LoveDrugVendingMachine · Kamau Salaam Nasser · GRUNGEzhou · Golden Crow · 30over9

## Keyboard

- `/` focus command bar
- `j` / `k` move footprint cursor
- Tab then Enter on **Skip to content** for a11y jump
- commands: `stream` · `categories` · `magazine` · `cosmogram` · `footprint` · `play` · `brands` · `help`
