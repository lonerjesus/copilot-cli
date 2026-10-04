import { CATALOG, type CatalogItem } from "@/data/catalog";
import { PLATFORMS } from "@/data/identity";

export type FootprintItem = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  platform: string;
  platformLabel: string;
  url: string;
  brand?: string;
  kind: string;
  source: "catalog" | "rss";
};

function platformLabel(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id.toUpperCase();
}

export function catalogToFootprint(items: CatalogItem[] = CATALOG): FootprintItem[] {
  return items.map((item) => ({
    id: `catalog:${item.id}`,
    title: item.title,
    summary: item.blurb,
    publishedAt: item.publishedAt,
    platform: item.platform,
    platformLabel: platformLabel(item.platform),
    url: item.externalUrl,
    brand: item.brand,
    kind: item.kind,
    source: "catalog" as const,
  }));
}

type RssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  content?: string;
};

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block: string, tag: string): string | undefined {
  const cdata = block.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"),
  );
  if (cdata?.[1]) return cdata[1].trim();
  const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return plain?.[1]?.trim();
}

export function parseRss(xml: string): RssItem[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  return items.map((block) => ({
    title: extractTag(block, "title"),
    link: extractTag(block, "link"),
    pubDate: extractTag(block, "pubDate"),
    description: extractTag(block, "description"),
    content: extractTag(block, "content:encoded") ?? extractTag(block, "content"),
  }));
}

export function rssToFootprint(items: RssItem[], platform = "substack"): FootprintItem[] {
  const FEED_HOSTS = new Set(["tellingshowoflove.substack.com"]);

  return items.flatMap((item, index) => {
    if (!item.title || !item.link) return [];
    let link: string;
    try {
      const url = new URL(item.link);
      if (url.protocol !== "https:") return [];
      if (url.username || url.password) return [];
      if (!FEED_HOSTS.has(url.hostname.toLowerCase())) return [];
      link = url.toString();
    } catch {
      return [];
    }

    const raw = item.content || item.description || "";
    const summary = stripHtml(raw).slice(0, 220);
    const publishedAt = item.pubDate
      ? new Date(item.pubDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    return [
      {
        id: `rss:${platform}:${link ?? index}`,
        title: stripHtml(item.title),
        summary: summary || "Live signal from the TSOL Substack uplink.",
        publishedAt,
        platform,
        platformLabel: platformLabel(platform),
        url: link,
        brand: "Telling Show Of Love",
        kind: "essay",
        source: "rss" as const,
      },
    ];
  });
}

export function mergeFootprint(
  primary: FootprintItem[],
  secondary: FootprintItem[],
): FootprintItem[] {
  const seen = new Set<string>();
  const merged: FootprintItem[] = [];

  for (const item of [...primary, ...secondary]) {
    const key = item.url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function fetchSubstackFeed(): Promise<FootprintItem[]> {
  const feedUrl = PLATFORMS.find((p) => p.id === "substack")?.feed;
  if (!feedUrl) return [];

  try {
    const res = await fetch(feedUrl, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "kamaunegasi.net/1.0 (+https://www.kamaunegasi.net)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return rssToFootprint(parseRss(xml), "substack");
  } catch {
    return [];
  }
}

export async function buildFootprint(): Promise<FootprintItem[]> {
  const catalog = catalogToFootprint();
  const rss = await fetchSubstackFeed();
  return mergeFootprint(rss, catalog);
}
