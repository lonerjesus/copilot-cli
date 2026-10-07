import type { CategoryId, SubcategoryId } from "@/data/taxonomy";

export type MediaKind = "video" | "audio" | "vlog" | "essay" | "still" | "live";

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
};

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

export function isHouseMedia(item: CatalogItem): boolean {
  if (item.source === "uploaded") return true;
  if (item.source === "fetched") return false;
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
      return item.kind === "essay";
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
