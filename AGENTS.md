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

**Verifier always runs last.** Exact house names only — never invent third-party identities.
