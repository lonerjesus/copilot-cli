/**
 * Album / series grouping helpers for house catalog items.
 * One CatalogItem per track or episode — collection is the shared parent.
 */

import type { CatalogCollection, CatalogItem } from "@/data/catalog";

export type CollectionType = CatalogCollection["type"];
export type { CatalogCollection };

const MAX_TITLE = 120;
const MAX_ID = 64;

export function slugifyCollection(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_ID);
}

export function validateCollection(raw: unknown): CatalogCollection | undefined {
  if (raw == null) return undefined;
  if (!raw || typeof raw !== "object") throw new Error("invalid_collection");
  const o = raw as Record<string, unknown>;
  const type = String(o.type ?? "").trim() as CollectionType;
  if (type !== "album" && type !== "series") throw new Error("invalid_collection");
  const title = String(o.title ?? "").trim().slice(0, MAX_TITLE);
  if (!title) throw new Error("invalid_collection");
  const idRaw = String(o.id ?? "").trim();
  const id = (idRaw ? slugifyCollection(idRaw) : slugifyCollection(title)).slice(0, MAX_ID);
  if (!id) throw new Error("invalid_collection");
  let index: number | undefined;
  if (o.index != null && o.index !== "") {
    const n = Number(o.index);
    if (!Number.isFinite(n) || n < 1 || n > 9999) throw new Error("invalid_collection");
    index = Math.floor(n);
  }
  return { type, id, title, index };
}

/** Stamp freeform tags so older UIs can still filter collections. */
export function collectionTags(collection: CatalogCollection): string[] {
  const tags = [`${collection.type}:${collection.id}`, collection.type];
  if (collection.index != null) {
    tags.push(`track:${String(collection.index).padStart(2, "0")}`);
  }
  return tags;
}

export function mergeCollectionTags(
  existing: string[],
  collection?: CatalogCollection,
): string[] {
  if (!collection) return existing.slice(0, 12);
  const stamped = collectionTags(collection);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...stamped, ...existing]) {
    const key = t.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= 12) break;
  }
  return out;
}

export type CollectionGroup = {
  collection: Omit<CatalogCollection, "index">;
  items: CatalogItem[];
};

/** Group house items that share a collection id (sorted by index then date). */
export function groupByCollection(items: CatalogItem[]): CollectionGroup[] {
  const map = new Map<string, CollectionGroup>();
  for (const item of items) {
    const c = item.collection;
    if (!c?.id || !c.title) continue;
    const key = `${c.type}:${c.id}`;
    let group = map.get(key);
    if (!group) {
      group = {
        collection: { type: c.type, id: c.id, title: c.title },
        items: [],
      };
      map.set(key, group);
    }
    group.items.push(item);
  }
  for (const group of map.values()) {
    group.items.sort((a, b) => {
      const ai = a.collection?.index ?? 9999;
      const bi = b.collection?.index ?? 9999;
      if (ai !== bi) return ai - bi;
      return a.publishedAt.localeCompare(b.publishedAt);
    });
  }
  return [...map.values()].sort((a, b) =>
    a.collection.title.localeCompare(b.collection.title),
  );
}

/** Natural-ish filename sort: "02 track" before "10 track". */
export function sortMediaFiles(files: File[]): File[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );
}

export function trackIndexFromName(name: string, fallback: number): number {
  const base = name.replace(/\.[^.]+$/, "");
  const m = /^(\d{1,3})[\s._-]+/.exec(base) || /(?:^|[\s_-])(\d{1,3})$/.exec(base);
  if (m?.[1]) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n >= 1 && n <= 9999) return n;
  }
  return fallback;
}
