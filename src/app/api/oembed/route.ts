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
  "www.kamaunegasi.me",
  "kamaunegasi.me",
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
  "html",
]);

const BROWSER_UA =
  "Mozilla/5.0 (compatible; KN-Poster/1.0; +https://www.kamaunegasi.net)";

function hostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(host)) return true;
  // Artist Bandcamp shops: *.bandcamp.com
  if (host.endsWith(".bandcamp.com")) return true;
  return false;
}

function parseSafeUrl(raw: string | null): URL | null {
  if (!raw || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (!hostAllowed(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function pickHttpsThumb(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("https://")) return null;
  if (raw.length > 2048) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function extractOgImage(html: string): string | null {
  const clipped = html.slice(0, 200_000);
  const patterns = [
    /property=["']og:image["'][^>]*content=["']([^"']+)/i,
    /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /property=["']og:image:secure_url["'][^>]*content=["']([^"']+)/i,
    /name=["']twitter:image["'][^>]*content=["']([^"']+)/i,
    /content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
  ];
  for (const re of patterns) {
    const m = re.exec(clipped);
    const thumb = pickHttpsThumb(m?.[1]);
    if (thumb) return thumb;
  }
  return null;
}

async function itunesArtwork(appleUrl: URL): Promise<Record<string, unknown> | null> {
  const id = /\/id(\d+)/.exec(appleUrl.pathname)?.[1];
  if (!id) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}`, {
      headers: { "User-Agent": BROWSER_UA },
      next: { revalidate: 600 },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{ artworkUrl600?: string; artworkUrl100?: string; collectionName?: string }>;
    };
    const row = data.results?.[0];
    const thumb = pickHttpsThumb(row?.artworkUrl600 ?? row?.artworkUrl100);
    if (!thumb) return null;
    return {
      type: "rich",
      version: "1.0",
      provider_name: "Apple Podcasts",
      title: row?.collectionName,
      thumbnail_url: thumb,
    };
  } catch {
    return null;
  }
}

async function scrapeOgThumbnail(url: URL): Promise<Record<string, unknown> | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 600 },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("text/html") && !ctype.includes("application/xhtml")) return null;
    const html = await res.text();
    if (html.length > 512_000) return null;
    const thumb = extractOgImage(html);
    if (!thumb) return null;
    return {
      type: "link",
      version: "1.0",
      provider_name: url.hostname,
      thumbnail_url: thumb,
    };
  } catch {
    return null;
  }
}

async function resolveJsonOEmbed(url: URL): Promise<Record<string, unknown> | null> {
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
      headers: { "User-Agent": BROWSER_UA },
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
    const thumb = pickHttpsThumb(out.thumbnail_url);
    if (thumb) out.thumbnail_url = thumb;
    else delete out.thumbnail_url;
    if (typeof out.html === "string") {
      out.html = out.html.slice(0, 4096);
    }
    return out;
  } catch {
    return null;
  }
}

async function resolveOEmbed(url: URL): Promise<Record<string, unknown> | null> {
  if (/podcasts\.apple\.com$/i.test(url.hostname)) {
    const apple = await itunesArtwork(url);
    if (apple) return apple;
  }

  const json = await resolveJsonOEmbed(url);
  if (json && pickHttpsThumb(json.thumbnail_url)) return json;

  const scraped = await scrapeOgThumbnail(url);
  if (scraped) return scraped;

  // Prefer JSON payload even without a thumb (title/html) over empty.
  return json;
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
