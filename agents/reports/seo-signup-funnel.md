# SEO + signup funnel (elite)

## Policy
- **Index** `/access`, `/privacy`, `/terms` — drive signup + trust.
- **Noindex** gated stream (`/`, admin, APIs).
- Preview bots (Discord/X/Meta/…) soft-land on `/access` for OG cards — scrapers still 403.

## Changes
- Richer `SITE.shareDescription` + OG/Twitter on `/access`
- JSON-LD `WebSite` + `Person` + `RegisterAction`
- AccessGate defaults to **create account** on first visit (`?mode=login|register`)
- Funnel analytics: `access_mode`, `register_*`, `login_*`; server allowlist includes `writing_open`
- `robots.txt` Allow `/access` (+ legal); sitemap lists access/privacy/terms
- Path-aware `X-Robots-Tag` (index on public doors)

## Verify
`qa:smoke` preview-bot + robots-allow-access + access-jsonld · `qa:gate`
