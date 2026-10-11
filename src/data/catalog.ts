import type { CategoryId, SubcategoryId } from "@/data/taxonomy";

export type MediaKind = "video" | "audio" | "vlog" | "writing" | "still" | "live";

/** Accept legacy `essay` from stored uploads. */
export function normalizeMediaKind(kind: string): MediaKind {
  if (kind === "essay") return "writing";
  return kind as MediaKind;
}

export type CatalogItem = {
  id: string;
  title: string;
  subtitle?: string;
  brand: string;
  kind: MediaKind;
  category: CategoryId;
  subcategory: SubcategoryId;
  duration?: string;
  publishedAt: string;
  platform: string;
  externalUrl: string;
  src?: string;
  poster?: string;
  source?: "fetched" | "uploaded";
  paywalled?: boolean;
  embed?: {
    provider: "youtube" | "vimeo" | "twitch" | "soundcloud" | "substack" | "audio" | "bandcamp";
    id?: string;
    url?: string;
  };
  tags: string[];
  blurb: string;
  /** Long-form house writing / notes (admin compose). */
  body?: string;
};

/** House stills — open in the Photos-style gallery, not the AV player. */
export function isPhotoStill(item: CatalogItem): boolean {
  return normalizeMediaKind(item.kind) === "still";
}

/** Best URL for a still (full image preferred over poster). */
export function photoSrc(item: CatalogItem): string | null {
  const candidates = [item.src, item.poster, item.externalUrl];
  for (const raw of candidates) {
    const v = (raw || "").trim();
    if (!v) continue;
    if (v.startsWith("/api/media/") || v.startsWith("https://") || v.startsWith("/")) {
      return v;
    }
  }
  return null;
}

/** Non-AV items that should open a reader or gallery (not the player). */
export function isReadableText(item: CatalogItem): boolean {
  const kind = normalizeMediaKind(item.kind);
  if (kind === "writing") return true;
  if (kind === "still") return true;
  return Boolean(item.body?.trim());
}

export function photoCatalog(items: CatalogItem[]): CatalogItem[] {
  return items.filter(isPhotoStill);
}

export function isPaywalled(item: CatalogItem): boolean {
  if (typeof item.paywalled === "boolean") return item.paywalled;
  if (item.source === "uploaded") return true;
  if (item.source === "fetched") return false;
  return false;
}

export const PLAYABLE_KINDS: ReadonlySet<MediaKind> = new Set([
  "audio",
  "video",
  "vlog",
  "live",
]);

export function isPlayableMedia(item: CatalogItem): boolean {
  return PLAYABLE_KINDS.has(item.kind);
}

export function playableCatalog(items: CatalogItem[]): CatalogItem[] {
  return items.filter(isPlayableMedia);
}

/** Newest publish date first; stable id tie-break for same-day rows. */
export function sortNewestFirst(items: CatalogItem[]): CatalogItem[] {
  return [...items].sort((a, b) => {
    const tb = new Date(b.publishedAt).getTime();
    const ta = new Date(a.publishedAt).getTime();
    const dt = (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    if (dt !== 0) return dt;
    return b.id.localeCompare(a.id);
  });
}

export function isHouseMedia(item: CatalogItem): boolean {
  if (item.source === "uploaded") return true;
  if (item.source === "fetched") return false;
  // Legacy / id-prefixed uploads without source still belong on the house stream.
  if (item.id.startsWith("up-")) return true;
  if (item.src?.includes("/api/media/house/") || item.poster?.includes("/api/media/house/")) {
    return true;
  }
  return isPaywalled(item);
}

export function isFetchedMedia(item: CatalogItem): boolean {
  return !isHouseMedia(item);
}

export function houseCatalog(items: CatalogItem[]): CatalogItem[] {
  return items.filter(isHouseMedia);
}

export type StreamRow = {
  id: string;
  title: string;
  hint: string;
  itemIds: string[];
};

/** House originals only — seed empty; admin publishes fill the stream. */
export const CATALOG: CatalogItem[] = [];

export const STREAM_ROWS: StreamRow[] = [
  { id: "now", title: "NOW", hint: "", itemIds: [] },
  { id: "video", title: "VIDEO", hint: "", itemIds: [] },
  { id: "music", title: "MUSIC", hint: "", itemIds: [] },
  { id: "photos", title: "PHOTO", hint: "", itemIds: [] },
  { id: "writing", title: "READ", hint: "", itemIds: [] },
];

export function streamRowMatches(rowId: string, item: CatalogItem): boolean {
  switch (rowId) {
    case "video":
      return item.kind === "video" || item.kind === "vlog" || item.kind === "live";
    case "music":
      return item.kind === "audio";
    case "photos":
      return item.kind === "still";
    case "writing":
      return item.kind === "writing";
    case "now":
      return true;
    default:
      return false;
  }
}

export function getItem(id: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === id);
}

export function getQueue(): CatalogItem[] {
  const pinned = STREAM_ROWS[0]!.itemIds
    .map((id) => getItem(id))
    .filter((item): item is CatalogItem => Boolean(item && isPlayableMedia(item)));
  if (pinned.length) return pinned;
  return playableCatalog(houseCatalog(CATALOG)).slice(0, 12);
}

export function getByCategory(
  category: CategoryId,
  subcategory?: SubcategoryId,
): CatalogItem[] {
  return houseCatalog(CATALOG).filter(
    (item) =>
      item.category === category && (!subcategory || item.subcategory === subcategory),
  );
}
