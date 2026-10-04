import { ALIASES } from "@/data/identity";
import { CATALOG, type CatalogItem } from "@/data/catalog";
import {
  CATEGORIES,
  findCategoryByQuery,
  type Category,
  type CategoryId,
  type Subcategory,
  type SubcategoryId,
} from "@/data/taxonomy";

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
    }
  | {
      type: "alias";
      name: string;
      kind: string;
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

  for (const item of CATALOG) {
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

  for (const alias of ALIASES) {
    const score = Math.max(
      scoreText(alias.name, q),
      scoreText(alias.short ?? "", q),
      scoreText(alias.kind, q),
      scoreText(alias.note ?? "", q),
    );
    if (score > 0) {
      hits.push({ type: "alias", name: alias.name, kind: alias.kind, score });
    }
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
          : hit.type === "alias"
            ? `alias:${hit.name}`
            : `cat:${hit.category.id}:${hit.subcategory?.id ?? ""}`;
      return arr.findIndex((other) => {
        const otherKey =
          other.type === "item"
            ? `item:${other.item.id}`
            : other.type === "alias"
              ? `alias:${other.name}`
              : `cat:${other.category.id}:${other.subcategory?.id ?? ""}`;
        return otherKey === key;
      }) === index;
    });
}

export function filterCatalog(options: {
  query?: string;
  category?: CategoryId | "all";
  subcategory?: SubcategoryId | "all";
}): CatalogItem[] {
  const { query = "", category = "all", subcategory = "all" } = options;
  const q = query.trim().toLowerCase();

  return CATALOG.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (subcategory !== "all" && item.subcategory !== subcategory) return false;
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
}
