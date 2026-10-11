# kamaunegasi.net

Autonomous portfolio + vlog platform for **Kendrick-Kamau Negasi, LLC**.

Futuristic terminal UI · streaming-style browse · chronic social footprint feed · custom audio/video deck that pulls posts from connected platforms.

## Access policy

- **Account required** — unauthenticated visitors are sent to `/access`
- **Anti-scrape** — bot UAs blocked, rate limits, robots disallow-all, APIs private/no-store
- **Donations** — signed-in members can support the site (`#support` / `/api/donate`)
- **Paid downloads** — stream/view with an account; **save/download only after purchasing that piece**

## Stack

- Next.js (App Router) + TypeScript + OpenNext on Cloudflare Workers
- Terminal design system (CSS variables, no card-heavy chrome)
- First-party auth (HTTP-only signed cookies · scrypt passwords · local `.data/` or Workers `AUTH_KV`)
- House media on **Cloudflare** — admin uploads store binaries in `AUTH_KV` (chunked); optional R2 via `MEDIA_R2` when the bucket is bound
- `/api/feed` · `/api/oembed` · `/api/ingest` (auth-gated)
- `/api/donate` · `/api/commerce/purchase` · `/api/commerce/download`
- Payments: `PAYMENTS_MODE=demo` locally, or Stripe via `STRIPE_SECRET_KEY`

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

Dashboard settings (matches `package.json` / `wrangler.toml`):

- **Build command:** `npm run build` (OpenNext → `.open-next/worker.js`)
- **Deploy command:** `npx wrangler deploy`

Before go-live:

1. Secret: `npx wrangler secret put AUTH_SECRET` (≥16 chars). **Required for production and Preview Deployments** — without it, `/api/auth/register` and login return `AUTH_SECRET must be set`. In the CF dashboard, also add `AUTH_SECRET` under Workers → Settings → Variables and Secrets for **Preview** (Preview builds do not always inherit production secrets).
2. Durable auth KV — production + Preview `preview_id` are set in `wrangler.toml` (`AUTH_KV`). Optional: create an isolated preview namespace with `npx wrangler kv namespace create AUTH_KV --preview` and replace `preview_id`.
3. Media — house uploads use `AUTH_KV` by default. Optional R2: `npm run cf:ensure-r2` (needs R2 Edit token), then add `[[r2_buckets]]` `MEDIA_R2` → `kamaunegasi-media` in `wrangler.toml`. Local without Workers writes to `.data/media/`.
4. Optional Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
5. Custom domains — `wrangler.toml` declares `www.kamaunegasi.net` + apex via `routes` (`custom_domain = true`). After deploy, confirm both hostnames under the Worker’s Custom Domains (live must not show Cloudflare’s “There is nothing here yet”).
6. SSL / host — turn on Cloudflare **Always Use HTTPS**. Middleware also 301s `http://` → `https://` and bare `kamaunegasi.net` → `www.kamaunegasi.net`. If HTTPS shows only a Bot Fight / “Just a moment…” challenge for real users, ease Bot Fight Mode for the zone or allowlist the signup path.
7. Var: `ADMIN_EMAIL` (owner account for `/admin` — set in `wrangler.toml` / CF vars)

Local Cloudflare preview:

```bash
npm run preview
```

Node host (no Workers): `npm run build:next && npm run start`.

## Identity nodes

Streetpolitik · GrownAssKids (GAK) · Black Oh-My · BLKDTY Music LLC · Kendrick-Kamau Negasi, LLC · Thelonious1 (TL1) · Telling Show Of Love (TSOL) · Telling Stills Of Love · Imponderabilia: Wall_Carpet 235 · 357Itsumi · Faust Fakeway · LoveDrugVendingMachine · Kamau Salaam Nasser · GRUNGEzhou · GRUNGEzhou Libellus · GRUNGEzhou Supply · GRUNGEzhou™ Libellus Supply · Grunge Daddy Ichiban · Golden Crow · Golden Crow Acquisitions · 30over9 · Good;Sloppy. · STPK's Smoker's Lounge Music · QUARANTINED THOUGHTS OF A STREET STATISTIC

## Keyboard

- `Space` — play / pause (when not typing)
- `Shift` + `←` / `→` — previous / next track
- `/` focus command bar (when mounted)
- `j` / `k` move footprint cursor
- Tab then Enter on **Skip to content** for a11y jump
- OS media keys / lock screen via Media Session API
- commands: `stream` · `categories` · `cosmogram` · `footprint` · `support` · `play` · `next` · `queue`
