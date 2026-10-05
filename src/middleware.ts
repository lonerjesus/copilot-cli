import { NextResponse, type NextRequest } from "next/server";
import {
  clientKey,
  isPublicPath,
  isSuspiciousBot,
  rateLimitAllow,
} from "@/lib/auth/bot";
import { hasValidSessionCookie, SESSION_COOKIE } from "@/lib/auth/token";

const SECURITY_HEADERS: Record<string, string> = {
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
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
