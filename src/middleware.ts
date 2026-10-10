import { NextResponse, type NextRequest } from "next/server";
import {
  clientKey,
  isLinkPreviewBot,
  isPublicPath,
  isSuspiciousBot,
  rateLimitAllow,
} from "@/lib/auth/bot";
import { hasValidSessionCookie, SESSION_COOKIE } from "@/lib/auth/token";
import { securityHeadersForPath } from "@/lib/security-headers";

function withSecurity(pathname: string, response: NextResponse) {
  for (const [key, value] of Object.entries(securityHeadersForPath(pathname))) {
    response.headers.set(key, value);
  }
  return response;
}

const CANONICAL_HOST = "www.kamaunegasi.net";
const APEX_HOST = "kamaunegasi.net";

function hostOf(request: NextRequest): string {
  return (request.headers.get("host") || request.nextUrl.host || "")
    .split(":")[0]!
    .toLowerCase();
}

/** Apex → www and HTTP → HTTPS (301). Complements CF “Always Use HTTPS”. */
function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const host = hostOf(request);
  const proto = (
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(":", "") ||
    "https"
  ).toLowerCase();
  const needsHttps = proto === "http";
  const needsWww = host === APEX_HOST;
  if (!needsHttps && !needsWww) return null;
  if (host !== APEX_HOST && host !== CANONICAL_HOST) return null;

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = CANONICAL_HOST;
  url.port = "";
  return withSecurity(
    request.nextUrl.pathname,
    NextResponse.redirect(url, 301),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = clientKey(request);
  const sessionOk = await hasValidSessionCookie(request.cookies.get(SESSION_COOKIE)?.value);

  const hostRedirect = canonicalHostRedirect(request);
  if (hostRedirect) return hostRedirect;

  // Local / memory-auth QA runs many suites back-to-back — raise ceilings.
  const qaAuth = process.env.ALLOW_MEMORY_AUTH === "1";
  const globalLimit = qaAuth ? 5000 : 120;
  const authLimit = qaAuth ? 500 : 12;
  const forgotLimit = qaAuth ? 120 : 6;
  // Chunked admin AV uploads (phone video ≈ dozens of parts) must not share the
  // tight anonymous global bucket — authenticated compose would 429 mid-file.
  const adminMediaUpload =
    sessionOk && pathname.startsWith("/api/admin/media");
  const adminMediaLimit = qaAuth ? 5000 : 600;

  if (adminMediaUpload) {
    if (!rateLimitAllow(`admin-media:${ip}`, adminMediaLimit, 60_000)) {
      return withSecurity(
        pathname,
        NextResponse.json({ error: "rate_limited" }, { status: 429 }),
      );
    }
  } else if (!rateLimitAllow(`global:${ip}`, globalLimit, 60_000)) {
    return withSecurity(
      pathname,
      NextResponse.json({ error: "rate_limited" }, { status: 429 }),
    );
  }

  const isPublic = isPublicPath(pathname);
  const botty = isSuspiciousBot(request);
  const preview = isLinkPreviewBot(request);

  if (pathname.startsWith("/api/auth/register") || pathname.startsWith("/api/auth/login")) {
    if (botty) {
      return withSecurity(
        pathname,
        NextResponse.json({ error: "forbidden" }, { status: 403 }),
      );
    }
    if (!rateLimitAllow(`auth:${ip}`, authLimit, 60_000)) {
      return withSecurity(
        pathname,
        NextResponse.json({ error: "rate_limited" }, { status: 429 }),
      );
    }
  }

  if (pathname.startsWith("/api/auth/forgot-password")) {
    if (botty) {
      return withSecurity(
        pathname,
        NextResponse.json({ error: "forbidden" }, { status: 403 }),
      );
    }
    if (!rateLimitAllow(`forgot:${ip}`, forgotLimit, 60_000)) {
      return withSecurity(
        pathname,
        NextResponse.json({ error: "rate_limited" }, { status: 429 }),
      );
    }
  }

  if (pathname.startsWith("/api/") && !isPublic) {
    if (botty && !sessionOk) {
      return withSecurity(
        pathname,
        NextResponse.json({ error: "forbidden" }, { status: 403 }),
      );
    }
    if (!sessionOk) {
      return withSecurity(
        pathname,
        NextResponse.json({ error: "auth_required" }, { status: 401 }),
      );
    }
    const response = withSecurity(pathname, NextResponse.next());
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  if (!isPublic && !pathname.startsWith("/_next") && !sessionOk) {
    const accountGate = process.env.ACCOUNT_GATE !== "0";
    if (!accountGate) {
      return withSecurity(pathname, NextResponse.next());
    }

    // Share cards: send preview bots to /access (indexable OG) instead of 403.
    if (preview) {
      const url = request.nextUrl.clone();
      url.pathname = "/access";
      url.search = "";
      return withSecurity("/access", NextResponse.redirect(url));
    }

    if (botty && pathname !== "/access") {
      return withSecurity(
        pathname,
        new NextResponse("Account required. Automated access denied.", {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/access";
    url.search = "";
    if (pathname !== "/") {
      url.searchParams.set("next", pathname);
    }
    return withSecurity("/access", NextResponse.redirect(url));
  }

  if (pathname === "/access" && sessionOk) {
    const nextRaw = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.search = "";
    if (nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.includes("://")) {
      url.pathname = nextRaw.split("?")[0] || "/";
    } else {
      url.pathname = "/";
    }
    return withSecurity(url.pathname, NextResponse.redirect(url));
  }

  const response = withSecurity(pathname, NextResponse.next());
  if (!isPublic || pathname === "/access") {
    // /access must never be CDN-cached for a year (auth door + Set-Cookie flows).
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  // Apply security headers to app routes + brand static assets (OG / favicon).
  // Do NOT exclude `*.jpg` globally — that skipped `/api/media/house/*.jpg`
  // and left session-gated posters without the edge auth gate.
  // Root-level public images under /public still work; only Next internals skip.
  matcher: [
    "/((?!_next/static|_next/image).*)",
    "/og.png",
    "/favicon.svg",
  ],
};
