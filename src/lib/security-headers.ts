/**
 * App security headers — emitted once by middleware only.
 *
 * Cloudflare (Workers / OpenNext): do not also set these in next.config
 * `headers()`, `public/_headers`, or CF Transform Rules for the same paths,
 * or browsers will see duplicates. CF bot fight / managed challenge headers
 * remain platform-owned and are separate from this list.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "off",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://tellingshowoflove.substack.com https://vimeo.com https://www.youtube.com https://bandcamp.com https://soundcloud.com https://api.stripe.com https://checkout.stripe.com",
    "frame-src 'self' https://player.twitch.tv https://www.twitch.tv https://player.vimeo.com https://www.youtube.com https://bandcamp.com https://w.soundcloud.com https://checkout.stripe.com https://js.stripe.com",
    "media-src 'self' blob: https:",
    "upgrade-insecure-requests",
  ].join("; "),
};
