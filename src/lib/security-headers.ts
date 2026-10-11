/**
 * App security headers — emitted once by middleware only.
 *
 * Cloudflare (Workers / OpenNext): do not also set these in next.config
 * `headers()`, `public/_headers`, or CF Transform Rules for the same paths,
 * or browsers will see duplicates. CF bot fight / managed challenge headers
 * remain platform-owned and are separate from this list.
 */

/** Dev-only: React Refresh needs eval. Production CSP stays tight (no unsafe-eval). */
const SCRIPT_SRC =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com"
    : "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com";

const BASE_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "off",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    SCRIPT_SRC,
    "connect-src 'self' https://tellingshowoflove.substack.com https://vimeo.com https://www.youtube.com https://bandcamp.com https://soundcloud.com https://api.stripe.com https://checkout.stripe.com https://cloudflareinsights.com https://fonts.googleapis.com https://fonts.gstatic.com",
    "frame-src 'self' https://player.twitch.tv https://www.twitch.tv https://player.vimeo.com https://www.youtube.com https://bandcamp.com https://w.soundcloud.com https://checkout.stripe.com https://js.stripe.com",
    "media-src 'self' blob: https:",
    "upgrade-insecure-requests",
  ].join("; "),
};

/** Stream + private surfaces — never index. */
export const SECURITY_HEADERS: Record<string, string> = {
  ...BASE_HEADERS,
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
};

/**
 * Public signup / trust doors — indexable so share cards + Search can drive
 * account creation. Stream stays noindex via SECURITY_HEADERS.
 */
export const PUBLIC_INDEX_HEADERS: Record<string, string> = {
  ...BASE_HEADERS,
  "X-Robots-Tag": "index, follow, max-image-preview:large",
};

/** Paths that may be crawled / shared (OG) without a session. */
export const INDEXABLE_PATHS = new Set([
  "/access",
  "/privacy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/og.png",
  "/favicon.svg",
  "/favicon.ico",
  "/logo-kn.png",
  "/logo-kn-light.png",
  "/logo-kn-phosphor.png",
  "/logo-kn-64.png",
  "/logo-kn-192.png",
  "/logo-kn-512.png",
]);

export function securityHeadersForPath(pathname: string): Record<string, string> {
  return INDEXABLE_PATHS.has(pathname) ? PUBLIC_INDEX_HEADERS : SECURITY_HEADERS;
}
