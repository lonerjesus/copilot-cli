/**
 * Load house AV that the landing Play CTA / idle dock can start.
 * Catalog seed is empty — live rows come from /api/catalog after auth.
 *
 * Order: newest `publishedAt` first (latest → older). Landing ▶ plays
 * index 0; ⏭ walks reverse-chronological through the house stream.
 */

import {
  houseCatalog,
  playableCatalog,
  sortNewestFirst,
  type CatalogItem,
} from "@/data/catalog";

export { sortNewestFirst };

export async function fetchPlayableHouse(
  signal?: AbortSignal,
): Promise<CatalogItem[]> {
  const res = await fetch("/api/catalog", {
    credentials: "same-origin",
    signal,
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json().catch(() => null)) as { items?: CatalogItem[] } | null;
  return sortNewestFirst(playableCatalog(houseCatalog(data?.items ?? [])));
}
