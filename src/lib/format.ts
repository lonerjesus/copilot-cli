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
