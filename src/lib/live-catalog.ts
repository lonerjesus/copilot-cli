import { CATALOG, type CatalogItem } from "@/data/catalog";
import { listUploads } from "@/lib/content-store";

/** Seed catalog + admin uploads (uploads win on id collision). */
export async function getLiveCatalog(): Promise<CatalogItem[]> {
  try {
    const uploads = await listUploads();
    if (uploads.length === 0) return [...CATALOG];
    const map = new Map<string, CatalogItem>();
    for (const item of CATALOG) map.set(item.id, item);
    for (const item of uploads) map.set(item.id, item);
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  } catch {
    return [...CATALOG];
  }
}

export async function getLiveItem(id: string): Promise<CatalogItem | undefined> {
  try {
    const uploads = await listUploads();
    const hit = uploads.find((u) => u.id === id);
    if (hit) return hit;
  } catch {
    /* seed only */
  }
  return CATALOG.find((c) => c.id === id);
}
