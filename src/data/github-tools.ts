/**
 * Curated free GitHub tools rack — exactly nine repos from the
 * @the_coding_wizard list (“These 9 GitHub repos feel way too powerful to be free”).
 * Outside house media; link-out only. Not streamed as house uploads.
 */

export type GithubTool = {
  id: string;
  name: string;
  repo: string;
  url: string;
  blurb: string;
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
    blurb: "Turn PDFs, videos, websites, and notes into a private AI research assistant.",
  },
  {
    id: "no-ai-slop",
    name: "No AI Slop",
    repo: "petergyang/no-ai-slop",
    url: "https://github.com/petergyang/no-ai-slop",
    blurb: "Remove generic AI-writing habits and make text feel more natural.",
  },
  {
    id: "i-have-adhd",
    name: "I Have ADHD",
    repo: "ayghri/i-have-adhd",
    url: "https://github.com/ayghri/i-have-adhd",
    blurb: "Make AI responses shorter, clearer, and straight to the point.",
  },
  {
    id: "open-seo",
    name: "OpenSEO",
    repo: "every-app/open-seo",
    url: "https://github.com/every-app/open-seo",
    blurb: "Open-source SEO research, audits, rankings, and competitor analysis.",
  },
  {
    id: "book-to-skill",
    name: "Book to Skill",
    repo: "virgiliojr94/book-to-skill",
    url: "https://github.com/virgiliojr94/book-to-skill",
    blurb: "Turn books and documents into reusable knowledge for your AI coding agent.",
  },
  {
    id: "omni-route",
    name: "Omni Route",
    repo: "diegosouzapw/OmniRoute",
    url: "https://github.com/diegosouzapw/OmniRoute",
    blurb: "Route coding tasks across different AI models and providers.",
  },
  {
    id: "ai-job-search",
    name: "AI Job Search",
    repo: "MadsLorentzen/ai-job-search",
    url: "https://github.com/MadsLorentzen/ai-job-search",
    blurb: "Use AI to analyze jobs, tailor applications, and prepare for interviews.",
  },
  {
    id: "strix",
    name: "Strix",
    repo: "usestrix/strix",
    url: "https://github.com/usestrix/strix",
    blurb: "Autonomous AI agents for finding and validating security vulnerabilities.",
  },
  {
    id: "open-generative-ai",
    name: "Open Generative AI",
    repo: "Anil-matcha/Open-Generative-AI",
    url: "https://github.com/Anil-matcha/Open-Generative-AI",
    blurb: "One open-source platform for experimenting with image, video, and generative AI models.",
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
