import { NextRequest, NextResponse } from "next/server";

const ALLOWED = [
  "https://tellingshowoflove.substack.com/",
  "https://vimeo.com/",
  "https://www.twitch.tv/",
  "https://www.toneden.io/",
  "https://www.youtube.com/",
  "https://youtu.be/",
];

function isAllowed(url: string): boolean {
  return ALLOWED.some((prefix) => url.startsWith(prefix));
}

async function resolveOEmbed(url: string): Promise<Record<string, unknown> | null> {
  const endpoints: Array<{ match: RegExp; endpoint: string }> = [
    {
      match: /substack\.com/i,
      endpoint: `https://tellingshowoflove.substack.com/api/v1/oembed?url=${encodeURIComponent(url)}`,
    },
    {
      match: /vimeo\.com/i,
      endpoint: `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
    },
    {
      match: /(youtube\.com|youtu\.be)/i,
      endpoint: `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    },
  ];

  const hit = endpoints.find((e) => e.match.test(url));
  if (!hit) {
    return {
      type: "link",
      version: "1.0",
      title: "External signal",
      provider_name: "kamaunegasi.net",
      url,
    };
  }

  try {
    const res = await fetch(hit.endpoint, {
      headers: { "User-Agent": "kamaunegasi.net/1.0" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !isAllowed(url)) {
    return NextResponse.json({ error: "url not allowed" }, { status: 400 });
  }

  const data = await resolveOEmbed(url);
  if (!data) {
    return NextResponse.json({ error: "oembed unavailable" }, { status: 502 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
