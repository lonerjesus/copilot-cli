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

## Deploy on Cloudflare Pages

1. Connect this repo in Cloudflare Pages.
2. Build command: `npm run build`
3. Framework preset: Next.js (use OpenNext / Cloudflare Next adapter if enabling edge API routes).
4. Attach custom domain `www.kamaunegasi.net`.
5. Set secrets: `AUTH_SECRET`, optional `STRIPE_SECRET_KEY` + `PAYMENTS_MODE=stripe`.
6. Confirm `wrangler.toml` vars: `SITE_DOMAIN`, `EXACT_NAME_POLICY`, `AGE_GATE_REQUIRED`, `ACCOUNT_GATE=1`.

For a static-first preview, `npm run build && npm run start` works on any Node host (auth store uses local `.data/`).

## Identity nodes

Streetpolitik · GrownAssKids (GAK) · Black Oh-My · BLKDTY Music LLC · Kendrick-Kamau Negasi LLC · Thelonious1 (TL1) · Telling Show Of Love (TSOL) · Telling Stills Of Love · Imponderabilia: Wall_Carpet 235 · 357Itsumi · Faust Fakeway · LoveDrugVendingMachine · Kamau Salaam Nasser · GRUNGEzhou · Golden Crow · 30over9

## Keyboard

- `/` focus command bar
- `j` / `k` move footprint cursor
- Tab then Enter on **Skip to content** for a11y jump
- commands: `stream` · `categories` · `magazine` · `cosmogram` · `footprint` · `support` · `play` · `brands` · `help`
