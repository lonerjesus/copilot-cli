export function formatStamp(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
    .format(date)
    .toUpperCase();
}

export function relativePulse(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return "SIGNAL";
  const delta = Date.now() - then;
  const days = Math.floor(delta / (1000 * 60 * 60 * 24));
  if (days < 1) return "TODAY";
  if (days === 1) return "1D";
  if (days < 30) return `${days}D`;
  if (days < 365) return `${Math.floor(days / 30)}MO`;
  return `${Math.floor(days / 365)}Y`;
}

export function kindGlyph(kind: string): string {
  switch (kind) {
    case "video":
      return "▶";
    case "audio":
      return "♫";
    case "vlog":
      return "◎";
    case "essay":
      return "¶";
    case "still":
      return "▣";
    case "live":
      return "●";
    default:
      return "›";
  }
}

/** Decode common HTML entities from RSS / scraped summaries. */
export function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, n: string) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => {
      const code = Number.parseInt(h, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}
