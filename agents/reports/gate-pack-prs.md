# Gate pack PRs

| Pack | Branch | PR | Status | Notes |
|------|--------|----|--------|-------|
| Gate | `cursor/gate-pack` | [#10](https://github.com/lonerjesus/copilot-cli/pull/10) | draft | Rebuilt from scratch on `lonerjesus/copilot-cli`. Spec store `bc-01a103a1-…` was not mounted in this Cloud Agent environment; implemented from kickoff checklist + live `main`. |

## Gate pack contents

1. AccessGate tagline `portfolio · vlog · stream` + commerce one-liner (free stream vs Stripe house downloads)
2. Absolute HTTPS `og:image` + `twitter:image` → `https://www.kamaunegasi.net/og.png`
3. `/privacy` + `/terms` (DOB/cosmogram privacy copy) + gate footer links
4. Forgot-password stub + password show/hide + ≥10 register helper
5. Security headers deduped to `src/lib/security-headers.ts` (middleware + next.config)

## Verification

- `tsc --noEmit` PASS
- `npm run build:next` PASS
- `qa-smoke` **45/45** PASS

## Out of scope (later packs)

- Full email password reset → Auth pack
- Public lobby → Lobby pack
- Member IA redesign
- `negasitheater` edits
