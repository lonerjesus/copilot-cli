import { NextResponse, type NextRequest } from "next/server";
import {
  clientKey,
  isPublicPath,
  isSuspiciousBot,
  rateLimitAllow,
} from "@/lib/auth/bot";
import { hasValidSessionCookie, SESSION_COOKIE } from "@/lib/auth/token";
import { SECURITY_HEADERS } from "@/lib/security-headers";

function withSecurity(response: NextResponse) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = clientKey(request);
  const sessionOk = await hasValidSessionCookie(request.cookies.get(SESSION_COOKIE)?.value);

  if (!rateLimitAllow(`global:${ip}`, 120, 60_000)) {
    return withSecurity(
      NextResponse.json({ error: "rate_limited" }, { status: 429 }),
    );
  }

  const isPublic = isPublicPath(pathname);
  const botty = isSuspiciousBot(request);

  if (pathname.startsWith("/api/auth/register") || pathname.startsWith("/api/auth/login")) {
    if (botty) {
      return withSecurity(NextResponse.json({ error: "forbidden" }, { status: 403 }));
    }
    if (!rateLimitAllow(`auth:${ip}`, 12, 60_000)) {
      return withSecurity(
        NextResponse.json({ error: "rate_limited" }, { status: 429 }),
      );
    }
  }

  if (pathname.startsWith("/api/auth/forgot-password")) {
    if (botty) {
      return withSecurity(NextResponse.json({ error: "forbidden" }, { status: 403 }));
    }
    if (!rateLimitAllow(`forgot:${ip}`, 6, 60_000)) {
      return withSecurity(
        NextResponse.json({ error: "rate_limited" }, { status: 429 }),
      );
    }
  }

  if (pathname.startsWith("/api/") && !isPublic) {
    if (botty && !sessionOk) {
      return withSecurity(NextResponse.json({ error: "forbidden" }, { status: 403 }));
    }
    if (!sessionOk) {
      return withSecurity(NextResponse.json({ error: "auth_required" }, { status: 401 }));
    }
    const response = withSecurity(NextResponse.next());
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  if (!isPublic && !pathname.startsWith("/_next") && !sessionOk) {
    const accountGate = process.env.ACCOUNT_GATE !== "0";
    if (!accountGate) {
      return withSecurity(NextResponse.next());
    }
    if (botty && pathname !== "/access") {
      return withSecurity(
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
    return withSecurity(NextResponse.redirect(url));
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
    return withSecurity(NextResponse.redirect(url));
  }

  const response = withSecurity(NextResponse.next());
  if (!isPublic) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  // Apply security headers to app routes + brand static assets (OG / favicon).
  // Other image extensions stay out of middleware for cache locality.
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:jpg|jpeg|gif|webp|png)$).*)",
    "/og.png",
    "/favicon.svg",
  ],
};
