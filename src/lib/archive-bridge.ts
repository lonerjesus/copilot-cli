/**
 * Server-side archive bridges (MagCloud chapbooks + TSOL Substack).
 * Kept off the Netflix house stream — surfaced only in House Atlas.
 */

export type ArchiveItem = {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: "magcloud" | "substack";
  sourceLabel: string;
  summary?: string;
  poster?: string;
};

const MAGCLOUD_FEED =
  "https://www.magcloud.com/feed/getrecentuserissues?username=streetpolitik";
const SUBSTACK_FEED = "https://tellingshowoflove.substack.com/feed";

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function pickTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(block);
  return (m?.[1] ?? m?.[2] ?? "").trim();
}

function pickImg(html: string): string | undefined {
  const m = /src=["'](https?:\/\/[^"']+)["']/i.exec(html);
  return m?.[1];
}

function parseRssItems(xml: string, source: ArchiveItem["source"], sourceLabel: string): ArchiveItem[] {
  const chunks = xml.split(/<item[\s>]/i).slice(1);
  const out: ArchiveItem[] = [];
  for (const [index, raw] of chunks.entries()) {
    const block = raw.split(/<\/item>/i)[0] ?? "";
    const title = stripHtml(pickTag(block, "title"));
    const link = stripHtml(pickTag(block, "link") || pickTag(block, "guid"));
    if (!title || !link.startsWith("https://")) continue;
    const description = pickTag(block, "description");
    const pub = pickTag(block, "pubDate");
    let publishedAt = new Date().toISOString().slice(0, 10);
    if (pub) {
      const d = new Date(pub);
      if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString().slice(0, 10);
    }
    out.push({
      id: `${source}:${link}`,
      title,
      url: link,
      publishedAt,
      source,
      sourceLabel,
      summary: stripHtml(description).slice(0, 220) || undefined,
      poster: pickImg(description),
    });
    if (index >= 11) break;
  }
  return out;
}

async function fetchXml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, */*",
        "User-Agent": "kamaunegasi.net/1.0 (+https://www.kamaunegasi.net)",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchMagCloudArchive(): Promise<ArchiveItem[]> {
  const xml = await fetchXml(MAGCLOUD_FEED);
  if (!xml) return [];
  return parseRssItems(xml, "magcloud", "MagCloud · streetpolitik");
}

export async function fetchSubstackArchive(): Promise<ArchiveItem[]> {
  const xml = await fetchXml(SUBSTACK_FEED);
  if (!xml) return [];
  return parseRssItems(xml, "substack", "Substack / TSOL");
}

export async function buildArchiveBridge(): Promise<ArchiveItem[]> {
  const [mag, sub] = await Promise.all([fetchMagCloudArchive(), fetchSubstackArchive()]);
  return [...mag, ...sub].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
