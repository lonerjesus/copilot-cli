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

/** Offline MagCloud shelf — used when Workers egress cannot reach MagCloud. */
const MAGCLOUD_FALLBACK: ArchiveItem[] = [
  {
    id: "magcloud:https://www.magcloud.com/browse/issue/672460",
    title:
      "QUARANTINED THOUGHTS OF A STREET STATISTIC VOL. 2: AWAKENING FROM NIGHT TERRORS TO REALITY",
    url: "https://www.magcloud.com/browse/issue/672460",
    publishedAt: "2013-12-05",
    source: "magcloud",
    sourceLabel: "MagCloud · streetpolitik",
    summary: "Published Thursday, December 5, 2013 by Kendrick Herring. 30 pages.",
    poster:
      "https://s3.amazonaws.com/storage1.magcloud.com/image/1de48f3cbc58d54db65710255af8638b.jpg",
  },
  {
    id: "magcloud:https://www.magcloud.com/browse/issue/665683",
    title:
      "QUARANTINED THOUGHTS OF A STREET STATISTIC VOL. 1: EVIL ACCORDING TO ANGLO-SAXON JESUS.",
    url: "https://www.magcloud.com/browse/issue/665683",
    publishedAt: "2013-11-26",
    source: "magcloud",
    sourceLabel: "MagCloud · streetpolitik",
    summary:
      "poems old and new about myself and those around me which were intended for one book but instead were broken down into chapbooks. Published Tuesday, November 26, 2013 by Kendrick Herring. 24 pages.",
    poster:
      "https://s3.amazonaws.com/storage4.magcloud.com/image/1a5a1700cbd777448ea13b4b5e957d18.jpg",
  },
];

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function pickTag(block: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i",
  );
  const m = re.exec(block);
  return (m?.[1] ?? m?.[2] ?? "").trim();
}

function pickImg(html: string): string | undefined {
  const m = /src=["'](https?:\/\/[^"']+)["']/i.exec(html);
  return m?.[1];
}

function tidySummary(title: string, description: string): string | undefined {
  let text = stripHtml(description);
  if (!text) return undefined;
  // MagCloud prefixes the full title — drop it so the blurb is not truncated mid-word.
  if (text.toLowerCase().startsWith(title.toLowerCase())) {
    text = text.slice(title.length).replace(/^[\s.:\-–—]+/, "").trim();
  }
  if (text.length <= 360) return text || undefined;
  const cut = text.slice(0, 360);
  const at = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "), cut.lastIndexOf(", "));
  return (at > 120 ? cut.slice(0, at + 1) : `${cut.trimEnd()}…`).trim();
}

function parseRssItems(
  xml: string,
  source: ArchiveItem["source"],
  sourceLabel: string,
): ArchiveItem[] {
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
      summary: tidySummary(title, description),
      poster: pickImg(description),
    });
    if (index >= 11) break;
  }
  return out;
}

async function fetchXml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, */*",
        "User-Agent": "kamaunegasi.net/1.0 (+https://www.kamaunegasi.net)",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchMagCloudArchive(): Promise<ArchiveItem[]> {
  const xml = await fetchXml(MAGCLOUD_FEED);
  if (!xml) return [...MAGCLOUD_FALLBACK];
  const live = parseRssItems(xml, "magcloud", "MagCloud · streetpolitik");
  return live.length ? live : [...MAGCLOUD_FALLBACK];
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
