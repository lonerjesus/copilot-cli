# House agent skills (third-party, verified)

Portable MIT agent skills vendored from the free GitHub tools rack.  
Full apps from that list stay **link-only** on House → stack — they are not vendored here.

| Skill | Upstream | Pin | Local path |
|-------|----------|-----|------------|
| `no-ai-slop` | [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) | `000650b15698` | `agents/skills/no-ai-slop/` |
| `i-have-adhd` | [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) | `723af7d9afaf` | `agents/skills/i-have-adhd/` |

Cursor mirrors live under `.cursor/skills/<name>/` (same files).

## Not vendored (verified skip)

| Repo | Why |
|------|-----|
| Open Notebook | Full self-hosted app — not a portable skill |
| OpenSEO | Platform + MCP; skills need DataForSEO keys |
| Book to Skill | Skill needs Python `book_to_skill` runtime — install upstream |
| Omni Route | Full AI gateway app |
| AI Job Search | Personal job framework / regional board skills — out of house scope |
| Strix | Offensive pentest agent — link-only; no exploit tooling in-repo |
| Open Generative AI | Full Electron/studio app |

See `agents/reports/github-tools-verify.md` for the full matrix.
