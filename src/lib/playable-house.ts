/**
 * Load house AV that the landing Play CTA / idle dock can start.
 * Catalog seed is empty — live rows come from /api/catalog after auth.
 */

import {
  houseCatalog,
  playableCatalog,
  type CatalogItem,
} from "@/data/catalog";

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
  return playableCatalog(houseCatalog(data?.items ?? []));
}
