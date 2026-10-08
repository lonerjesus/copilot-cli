# GitHub tools rack — nine free repos

**Source:** Instagram/Threads `@the_coding_wizard` — “These 9 GitHub repos feel way too powerful to be free” (user image + Meta AI extract).  
**Target:** `src/data/github-tools.ts` → House Atlas panel `stack`  
**Check:** `GITHUB_TOOLS.length === 9` (asserted at module load)

| # | Name | Repo | CatalogItem / id |
|---|------|------|------------------|
| 1 | Open Notebook | lfnovo/open-notebook | `open-notebook` |
| 2 | No AI Slop | petergyang/no-ai-slop | `no-ai-slop` |
| 3 | I Have ADHD | ayghri/i-have-adhd | `i-have-adhd` |
| 4 | OpenSEO | every-app/open-seo | `open-seo` |
| 5 | Book to Skill | virgiliojr94/book-to-skill | `book-to-skill` |
| 6 | Omni Route | diegosouzapw/OmniRoute | `omni-route` |
| 7 | AI Job Search | MadsLorentzen/ai-job-search | `ai-job-search` |
| 8 | Strix | usestrix/strix | `strix` |
| 9 | Open Generative AI | Anil-matcha/Open-Generative-AI | `open-generative-ai` |

## Notes

- Meta AI extract did **not** land in the repo before this PR (0/9). This commit adds all nine.
- Link-out by default — not house uploads, not Netflix stream shelves.
- URLs verified `200` via GitHub API (2026-10-08).
- Follow-up: see `github-tools-verify.md` — vendored **No AI Slop** + **I Have ADHD** only.
