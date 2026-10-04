# kamaunegasi.net

Autonomous portfolio + vlog platform for **Kendrick-Kamau Negasi**.

Futuristic terminal UI · streaming-style browse · chronic social footprint feed · custom audio/video deck that pulls posts from connected platforms.

## Access policy

- **Account required** — unauthenticated visitors are sent to `/access`
- **Anti-scrape** — bot UAs blocked, rate limits, robots disallow-all, APIs private/no-store
- **Donations** — signed-in members can support the site (`#support` / `/api/donate`)
- **Paid downloads** — stream/view with an account; **save/download only after purchasing that piece**

## Stack

- Next.js (App Router) + TypeScript
- Terminal design system (CSS variables, no card-heavy chrome)
- First-party auth (HTTP-only signed cookies · scrypt passwords · `.data/` store)
- `/api/feed` · `/api/oembed` · `/api/ingest` (auth-gated)
- `/api/donate` · `/api/commerce/purchase` · `/api/commerce/download`
- Payments: `PAYMENTS_MODE=demo` locally, or Stripe via `STRIPE_SECRET_KEY`
- Ready for Cloudflare Pages (`wrangler.toml` · domain `www.kamaunegasi.net`)

## Develop

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000/access](http://localhost:3000/access), create an account (18+), then enter the stream.

## QA smoke

```bash
bash scripts/qa-smoke.sh http://localhost:3000
# or
npm run qa:smoke
```

## Agent squad

See [`agents/ROSTER.md`](./agents/ROSTER.md) and [`agents/RUNBOOK.md`](./agents/RUNBOOK.md). Eleven cooperating specialists; **verifier always last**.

## Deploy on Cloudflare Workers (OpenNext)

1. In the Cloudflare project build settings set:
   - **Build command:** `npx @opennextjs/cloudflare build`
   - **Deploy command:** `npx @opennextjs/cloudflare deploy`
2. Secrets: `AUTH_SECRET`, optional Stripe keys.
3. Attach custom domain `www.kamaunegasi.net`.

Local Cloudflare preview:

```bash
npm run preview
```

For a Node host instead: `npm run build && npm run start`.

## Identity nodes

Streetpolitik · GrownAssKids (GAK) · Black Oh-My · BLKDTY Music LLC · Kendrick-Kamau Negasi LLC · Thelonious1 (TL1) · Telling Show Of Love (TSOL) · Telling Stills Of Love · Imponderabilia: Wall_Carpet 235 · 357Itsumi · Faust Fakeway · LoveDrugVendingMachine · Kamau Salaam Nasser · GRUNGEzhou · Golden Crow · 30over9

## Keyboard

- `/` focus command bar
- `j` / `k` move footprint cursor
- Tab then Enter on **Skip to content** for a11y jump
- commands: `stream` · `categories` · `magazine` · `cosmogram` · `footprint` · `support` · `play` · `brands` · `help`
