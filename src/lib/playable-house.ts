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
  type CatalogItem,
} from "@/data/catalog";

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
