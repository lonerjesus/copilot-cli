import type { NextRequest } from "next/server";

/** Known scraper / non-browser fetch clients. Session still required; this is belt-and-suspenders. */
const BOT_UA =
  /\b(bot|crawler|spider|crawling|slurp|wget|curl|python-requests|python-urllib|scrapy|httpclient|go-http-client|libwww|mechanize|headlesschrome|phantomjs|selenium|puppeteer|playwright|axios\/|node-fetch|okhttp|java\/|perl|ruby|php\/|aiohttp|httpx|postman|insomnia|scrapy|bytespider|gptbot|claudebot|anthropic|ccbot|petalbot|semrush|ahrefs|dataforseo|mj12bot|dotbot|bingpreview|facebookexternalhit|twitterbot|linkedinbot|embedly|quora|redditbot|discordbot|telegrambot|whatsapp|preview)\b/i;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function isSuspiciousBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent")?.trim() ?? "";
  if (!ua || ua.length < 12) return true;
  if (BOT_UA.test(ua)) return true;
  return false;
}

export function clientKey(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return fwd || real || "unknown";
}

/** Sliding window rate limit. Returns true if allowed. */
export function rateLimitAllow(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Public paths that never require a session */
export const PUBLIC_PATHS = new Set([
  "/access",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/favicon.svg",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/commerce/webhook",
]);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  return false;
}
