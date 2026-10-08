# GitHub tools rack — verification matrix

**Date:** 2026-10-08  
**Source list:** `@the_coding_wizard` nine free repos  
**Rule:** Vendor only MIT portable agent skills with LICENSE + commit pin. No new npm deps. No full apps. No offensive tooling.

| # | Name | License | Kind | Verdict | Action |
|---|------|---------|------|---------|--------|
| 1 | Open Notebook | MIT | full-app | link-only | Keep stack link |
| 2 | No AI Slop | MIT | agent-skill | **vendored** | `agents/skills/no-ai-slop` + `.cursor/skills/no-ai-slop` |
| 3 | I Have ADHD | MIT | agent-skill | **vendored** | `agents/skills/i-have-adhd` + `.cursor/skills/i-have-adhd` |
| 4 | OpenSEO | MIT | platform | link-only | Skills need MCP/API keys |
| 5 | Book to Skill | MIT | agent-skill+runtime | link-only | SKILL.md alone is incomplete without Python package |
| 6 | Omni Route | MIT | full-app | link-only | Gateway platform |
| 7 | AI Job Search | MIT | framework | link-only | Personal/regional job skills — not house media |
| 8 | Strix | Apache-2.0 | full-app (offensive) | link-only | No pentest/exploit code in house repo |
| 9 | Open Generative AI | MIT | full-app | link-only | Electron studio — not incorporated |

## Pins (vendored)

- `petergyang/no-ai-slop@000650b15698` — `SKILL.md` + `eval.md` + `LICENSE`
- `ayghri/i-have-adhd@723af7d9afaf` — `SKILL.md` + `LICENSE`

## Related house PR (not mixed here)

PR #34 (expert-tier harden) is separate verified product code (player Range/EOF, writings reader, photos). It touches `HouseAtlas` / `AppShell` / `globals.css` — keep on its own branch to avoid stack-panel conflicts.
