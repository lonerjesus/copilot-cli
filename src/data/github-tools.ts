/**
 * Curated free GitHub tools rack — exactly nine repos from the
 * @the_coding_wizard list (“These 9 GitHub repos feel way too powerful to be free”).
 * Outside house media; link-out only unless a portable MIT skill was verified and vendored.
 */

export type GithubToolKind = "agent-skill" | "full-app" | "platform" | "framework";

export type GithubToolVerdict = "vendored" | "link-only";

export type GithubTool = {
  id: string;
  name: string;
  repo: string;
  url: string;
  blurb: string;
  license: string;
  kind: GithubToolKind;
  verdict: GithubToolVerdict;
  /** Why we did or did not vendor code */
  note: string;
  /** Local skill dir under agents/skills when vendored */
  localSkill?: string;
  /** Upstream commit pin when vendored */
  pinnedCommit?: string;
};

export const GITHUB_TOOLS_SOURCE =
  "Instagram/Threads · @the_coding_wizard · These 9 GitHub repos feel way too powerful to be free";

/** Fixed set of nine — keep length in sync with the source list. */
export const GITHUB_TOOLS: readonly GithubTool[] = [
  {
    id: "open-notebook",
    name: "Open Notebook",
    repo: "lfnovo/open-notebook",
    url: "https://github.com/lfnovo/open-notebook",
    blurb: "Self-host a private research notebook over PDFs, video, sites, and notes.",
    license: "MIT",
    kind: "full-app",
    verdict: "link-only",
    note: "Full self-hosted app — not a portable skill.",
  },
  {
    id: "no-ai-slop",
    name: "No AI Slop",
    repo: "petergyang/no-ai-slop",
    url: "https://github.com/petergyang/no-ai-slop",
    blurb: "Cut AI writing tells. Keep the writer's voice. Installed locally.",
    license: "MIT",
    kind: "agent-skill",
    verdict: "vendored",
    note: "MIT portable skill + eval — vendored under agents/skills/no-ai-slop.",
    localSkill: "agents/skills/no-ai-slop",
    pinnedCommit: "000650b15698",
  },
  {
    id: "i-have-adhd",
    name: "I Have ADHD",
    repo: "ayghri/i-have-adhd",
    url: "https://github.com/ayghri/i-have-adhd",
    blurb: "Lead with the next action. Number the steps. Installed locally.",
    license: "MIT",
    kind: "agent-skill",
    verdict: "vendored",
    note: "MIT portable output-style skill — vendored under agents/skills/i-have-adhd.",
    localSkill: "agents/skills/i-have-adhd",
    pinnedCommit: "723af7d9afaf",
  },
  {
    id: "open-seo",
    name: "OpenSEO",
    repo: "every-app/open-seo",
    url: "https://github.com/every-app/open-seo",
    blurb: "Self-host SEO research, audits, rankings, and competitor checks.",
    license: "MIT",
    kind: "platform",
    verdict: "link-only",
    note: "Platform + MCP skills require DataForSEO API keys — not vendored.",
  },
  {
    id: "book-to-skill",
    name: "Book to Skill",
    repo: "virgiliojr94/book-to-skill",
    url: "https://github.com/virgiliojr94/book-to-skill",
    blurb: "Turn a book or doc into an agent skill (needs Python runtime).",
    license: "MIT",
    kind: "agent-skill",
    verdict: "link-only",
    note: "SKILL.md needs Python book_to_skill runtime — install upstream, not vendored incomplete.",
  },
  {
    id: "omni-route",
    name: "Omni Route",
    repo: "diegosouzapw/OmniRoute",
    url: "https://github.com/diegosouzapw/OmniRoute",
    blurb: "One gateway that routes coding work across models and providers.",
    license: "MIT",
    kind: "full-app",
    verdict: "link-only",
    note: "Full AI gateway app — link-only.",
  },
  {
    id: "ai-job-search",
    name: "AI Job Search",
    repo: "MadsLorentzen/ai-job-search",
    url: "https://github.com/MadsLorentzen/ai-job-search",
    blurb: "Local job pipeline: score postings, tailor apps, prep interviews.",
    license: "MIT",
    kind: "framework",
    verdict: "link-only",
    note: "Personal/regional job framework — out of house media scope.",
  },
  {
    id: "strix",
    name: "Strix",
    repo: "usestrix/strix",
    url: "https://github.com/usestrix/strix",
    blurb: "AI pentest agents that find and validate vulns (external tool).",
    license: "Apache-2.0",
    kind: "full-app",
    verdict: "link-only",
    note: "Offensive pentest tooling — link-only; no exploit code in house repo.",
  },
  {
    id: "open-generative-ai",
    name: "Open Generative AI",
    repo: "Anil-matcha/Open-Generative-AI",
    url: "https://github.com/Anil-matcha/Open-Generative-AI",
    blurb: "Self-host an image/video generation studio across many models.",
    license: "MIT",
    kind: "full-app",
    verdict: "link-only",
    note: "Full Electron/studio app — link-only.",
  },
] as const;

export const GITHUB_TOOLS_COUNT = 9;

if (GITHUB_TOOLS.length !== GITHUB_TOOLS_COUNT) {
  throw new Error(
    `GITHUB_TOOLS must have exactly ${GITHUB_TOOLS_COUNT} entries (got ${GITHUB_TOOLS.length})`,
  );
}

export function githubToolById(id: string): GithubTool | undefined {
  return GITHUB_TOOLS.find((t) => t.id === id);
}

export function vendoredGithubTools(): GithubTool[] {
  return GITHUB_TOOLS.filter((t) => t.verdict === "vendored");
}
