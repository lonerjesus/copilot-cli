<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# House agent squad

Permanent multi-agent protocol for **www.kamaunegasi.net**:

- [`agents/ROSTER.md`](./agents/ROSTER.md) — specialists + exact-name policy (+ `code-checker`)
- [`agents/RUNBOOK.md`](./agents/RUNBOOK.md) — wave order + trigger matrix
- [`agents/squad.json`](./agents/squad.json) — machine-readable roster
- [`agents/checkers/`](./agents/checkers/) — task code-checker packs (responsive · stream · Netflix house · deploy)
- [`agents/skills/`](./agents/skills/) — vendored portable skills (mirrors under `.cursor/skills/`)

## Copy & UX skills (binding on user-facing text)

When editing UI copy, empty states, errors, CTAs, or docs the member reads:

1. Run [`agents/skills/no-ai-slop/SKILL.md`](./agents/skills/no-ai-slop/SKILL.md) — cut AI tells; keep house voice and exact names.
2. Run [`agents/skills/i-have-adhd/SKILL.md`](./agents/skills/i-have-adhd/SKILL.md) — lead with the next action; number multi-step paths; matter-of-fact errors; one concrete next step.

**Verifier always runs last.** Exact house names only — never invent third-party identities.
