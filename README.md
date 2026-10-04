# kamaunegasi.net

Autonomous portfolio + vlog platform for **Kendrick-Kamau Negasi**.

Futuristic terminal UI · streaming-style browse · chronic social footprint feed · custom audio/video deck that pulls posts from connected platforms.

## Stack

- Next.js (App Router) + TypeScript
- Terminal design system (CSS variables, no card-heavy chrome)
- `/api/feed` aggregates catalog + live Substack RSS
- `/api/oembed` proxies allowed platform oEmbed lookups
- Ready for Cloudflare (domain already on Cloudflare)

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Cloudflare Pages

1. Connect this repo in Cloudflare Pages.
2. Build command: `npm run build`
3. Framework preset: Next.js (use OpenNext / Cloudflare Next adapter if enabling edge API routes).
4. Attach custom domain `www.kamaunegasi.net`.

For a static-first preview, `npm run build && npm run start` works on any Node host.

## Identity nodes

Streetpolitik · GrownAssKids (GAK) · Black Oh-My · BLKDTY Music LLC · Kendrick-Kamau Negasi LLC · Thelonious1 (TL1) · Telling Show Of Love (TSOL) · Telling Stills Of Love · Imponderabilia: Wall_Carpet 235 · 357Itsumi · Faust Fakeway · LoveDrugVendingMachine · Kamau Salaam Nasser

## Keyboard

- `/` focus command bar
- `j` / `k` move footprint cursor
- commands: `stream` · `footprint` · `play` · `brands` · `help`
