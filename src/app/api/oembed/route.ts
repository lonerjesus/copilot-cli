import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "tellingshowoflove.substack.com",
  "vimeo.com",
  "www.vimeo.com",
  "www.twitch.tv",
  "twitch.tv",
  "www.toneden.io",
  "toneden.io",
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "www.magcloud.com",
  "magcloud.com",
  "podcasts.apple.com",
  "357itsumi.bandcamp.com",
  "bandcamp.com",
  "m.soundcloud.com",
  "soundcloud.com",
  "www.soundcloud.com",
  "www.slushy.com",
  "slushy.com",
  "www.shazam.com",
  "shazam.com",
  "www.facebook.com",
  "facebook.com",
  "rumble.com",
  "www.rumble.com",
]);

const SAFE_KEYS = new Set([
  "type",
  "version",
  "title",
  "provider_name",
  "provider_url",
  "thumbnail_url",
  "author_name",
  "width",
  "height",
]);

function parseSafeUrl(raw: string | null): URL | null {
  if (!raw || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
}

async function resolveOEmbed(url: URL): Promise<Record<string, unknown> | null> {
  const href = url.toString();
  const endpoints: Array<{ match: RegExp; endpoint: string }> = [
    {
      match: /substack\.com$/i,
      endpoint: `https://tellingshowoflove.substack.com/api/v1/oembed?url=${encodeURIComponent(href)}`,
    },
    {
      match: /vimeo\.com$/i,
      endpoint: `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(href)}`,
    },
    {
      match: /(youtube\.com|youtu\.be)$/i,
      endpoint: `https://www.youtube.com/oembed?url=${encodeURIComponent(href)}&format=json`,
    },
    {
      match: /bandcamp\.com$/i,
      endpoint: `https://bandcamp.com/oembed?url=${encodeURIComponent(href)}&format=json`,
    },
    {
      match: /soundcloud\.com$/i,
      endpoint: `https://soundcloud.com/oembed?url=${encodeURIComponent(href)}&format=json`,
    },
  ];

  const hit = endpoints.find((e) => e.match.test(url.hostname));
  if (!hit) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(hit.endpoint, {
      headers: { "User-Agent": "kamaunegasi.net/1.0" },
      next: { revalidate: 600 },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("json")) return null;
    const text = await res.text();
    if (text.length > 32_768) return null;
    const data = JSON.parse(text) as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of SAFE_KEYS) {
      if (key in data) out[key] = data[key];
    }
    if (typeof out.thumbnail_url === "string" && !out.thumbnail_url.startsWith("https://")) {
      delete out.thumbnail_url;
    }
    return out;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const url = parseSafeUrl(request.nextUrl.searchParams.get("url"));
  if (!url) {
    return NextResponse.json({ error: "url not allowed" }, { status: 400 });
  }

  const data = await resolveOEmbed(url);
  if (!data) {
    return NextResponse.json({ error: "oembed unavailable" }, { status: 502 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
