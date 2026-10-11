/**
 * Load house AV for landing Play / idle dock.
 * Newest `publishedAt` first — ▶ starts latest; ⏭ walks older.
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
