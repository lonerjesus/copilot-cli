import { CATALOG, houseCatalog, type CatalogItem, type MediaKind } from "@/data/catalog";
import {
  CATEGORIES,
  findCategoryByQuery,
  type Category,
  type CategoryId,
  type Subcategory,
  type SubcategoryId,
} from "@/data/taxonomy";

export type SortMode = "newest" | "oldest" | "title" | "brand";

export type CatalogFilters = {
  query?: string;
  category?: CategoryId | "all";
  subcategory?: SubcategoryId | "all";
  kind?: MediaKind | "all";
  platform?: string | "all";
  brand?: string | "all";
  sort?: SortMode;
  items?: CatalogItem[];
};

export type SearchHit =
  | {
      type: "item";
      item: CatalogItem;
      score: number;
    }
  | {
      type: "category";
      category: Category;
      subcategory?: Subcategory;
      score: number;
    };

function scoreText(haystack: string, query: string): number {
  const h = haystack.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return 0;
  if (h === q) return 100;
  if (h.startsWith(q)) return 80;
  if (h.includes(q)) return 55;
  const parts = q.split(/\s+/).filter(Boolean);
  if (parts.length > 1 && parts.every((p) => h.includes(p))) return 45;
  return 0;
}

export function uniqueBrands(items: CatalogItem[] = houseCatalog(CATALOG)): string[] {
  return Array.from(new Set(items.map((item) => item.brand))).sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Soft brand match — catalog brand field, tags, title, or blurb. */
export function itemMatchesBrand(item: CatalogItem, brand: string): boolean {
  if (!brand || brand === "all") return true;
  if (item.brand === brand) return true;
  const needle = brand.toLowerCase();
  const blob = [item.brand, item.title, item.subtitle, item.blurb, ...item.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return blob.includes(needle);
}

export function uniquePlatforms(items: CatalogItem[] = houseCatalog(CATALOG)): string[] {
  return Array.from(new Set(items.map((item) => item.platform))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function uniqueKinds(items: CatalogItem[] = houseCatalog(CATALOG)): MediaKind[] {
  return Array.from(new Set(items.map((item) => item.kind))) as MediaKind[];
}

export function searchCatalog(query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: SearchHit[] = [];
  const { category, subcategory } = findCategoryByQuery(q);

  if (category) {
    hits.push({
      type: "category",
      category,
      subcategory,
      score: subcategory ? 95 : 90,
    });
  }

  for (const item of houseCatalog(CATALOG)) {
    const fields = [
      item.title,
      item.subtitle ?? "",
      item.brand,
      item.kind,
      item.category,
      item.subcategory,
      item.platform,
      item.blurb,
      ...item.tags,
    ];
    const score = Math.max(...fields.map((f) => scoreText(f, q)));
    if (score > 0) hits.push({ type: "item", item, score });
  }

  for (const cat of CATEGORIES) {
    if (category?.id === cat.id) continue;
    const catScore = Math.max(
      scoreText(cat.id, q),
      scoreText(cat.label, q),
      ...cat.keywords.map((k) => scoreText(k, q)),
    );
    if (catScore > 0) {
      hits.push({ type: "category", category: cat, score: catScore });
    }
    for (const sub of cat.subcategories) {
      if (subcategory?.id === sub.id && category?.id === cat.id) continue;
      const subScore = Math.max(
        scoreText(sub.id, q),
        scoreText(sub.label, q),
        ...sub.keywords.map((k) => scoreText(k, q)),
      );
      if (subScore > 0) {
        hits.push({ type: "category", category: cat, subcategory: sub, score: subScore });
      }
    }
  }

  return hits
    .sort((a, b) => b.score - a.score)
    .filter((hit, index, arr) => {
      const key =
        hit.type === "item"
          ? `item:${hit.item.id}`
          : `cat:${hit.category.id}:${hit.subcategory?.id ?? ""}`;
      return (
        arr.findIndex((other) => {
          const otherKey =
            other.type === "item"
              ? `item:${other.item.id}`
              : `cat:${other.category.id}:${other.subcategory?.id ?? ""}`;
          return otherKey === key;
        }) === index
      );
    });
}

function sortItems(items: CatalogItem[], sort: SortMode): CatalogItem[] {
  const copy = [...items];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
      );
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "brand":
      return copy.sort((a, b) => a.brand.localeCompare(b.brand) || a.title.localeCompare(b.title));
    case "newest":
    default:
      return copy.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
  }
}

export function filterCatalog(options: CatalogFilters): CatalogItem[] {
  const {
    query = "",
    category = "all",
    subcategory = "all",
    kind = "all",
    platform = "all",
    brand = "all",
    sort = "newest",
    items = houseCatalog(CATALOG),
  } = options;
  const q = query.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (subcategory !== "all" && item.subcategory !== subcategory) return false;
    if (kind !== "all" && item.kind !== kind) return false;
    if (platform !== "all" && item.platform !== platform) return false;
    if (brand !== "all" && !itemMatchesBrand(item, brand)) return false;
    if (!q) return true;
    const blob = [
      item.title,
      item.subtitle,
      item.brand,
      item.kind,
      item.category,
      item.subcategory,
      item.platform,
      item.blurb,
      ...item.tags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return blob.includes(q) || q.split(/\s+/).every((part) => blob.includes(part));
  });

  return sortItems(filtered, sort);
}

export function activeFilterCount(filters: CatalogFilters): number {
  let count = 0;
  if (filters.query?.trim()) count += 1;
  if (filters.category && filters.category !== "all") count += 1;
  if (filters.subcategory && filters.subcategory !== "all") count += 1;
  if (filters.kind && filters.kind !== "all") count += 1;
  if (filters.platform && filters.platform !== "all") count += 1;
  if (filters.brand && filters.brand !== "all") count += 1;
  if (filters.sort && filters.sort !== "newest") count += 1;
  return count;
}
