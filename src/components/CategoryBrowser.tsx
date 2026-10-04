"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { CATALOG, isPaywalled, type CatalogItem, type MediaKind } from "@/data/catalog";
import {
  CATEGORIES,
  getCategory,
  getSubcategory,
  type CategoryId,
  type SubcategoryId,
} from "@/data/taxonomy";
import {
  activeFilterCount,
  filterCatalog,
  uniqueBrands,
  uniqueKinds,
  uniquePlatforms,
  type SortMode,
} from "@/lib/search";
import { kindGlyph } from "@/lib/format";
import { usePlayerState } from "@/components/player/PlayerContext";
import { useMagazine } from "@/components/MagazineContext";
import { track } from "@/lib/analytics";
import { MediaPoster } from "@/components/MediaPoster";

type CategoryBrowserProps = {
  initialQuery?: string;
  initialCategory?: CategoryId | "all";
  initialSubcategory?: SubcategoryId | "all";
};

export function CategoryBrowser({
  initialQuery = "",
  initialCategory = "all",
  initialSubcategory = "all",
}: CategoryBrowserProps) {
  const { current, playItem } = usePlayerState();
  const { openMagazine, hasMagazine } = useMagazine();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryId | "all">(initialCategory);
  const [subcategory, setSubcategory] = useState<SubcategoryId | "all">(initialSubcategory);
  const [kind, setKind] = useState<MediaKind | "all">("all");
  const [platform, setPlatform] = useState<string | "all">("all");
  const [brand, setBrand] = useState<string | "all">("all");
  const [sort, setSort] = useState<SortMode>("newest");

  const deferredQuery = useDeferredValue(query);
  const brands = useMemo(() => uniqueBrands(), []);
  const platforms = useMemo(() => uniquePlatforms(), []);
  const kinds = useMemo(() => uniqueKinds(), []);

  const activeCategory = category === "all" ? undefined : getCategory(category);
  const subOptions = activeCategory?.subcategories ?? [];

  const results = useMemo(
    () =>
      filterCatalog({
        query: deferredQuery,
        category,
        subcategory,
        kind,
        platform,
        brand,
        sort,
      }),
    [deferredQuery, category, subcategory, kind, platform, brand, sort],
  );

  const filterCount = activeFilterCount({
    query: deferredQuery,
    category,
    subcategory,
    kind,
    platform,
    brand,
    sort,
  });

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { categoryId: CategoryId; subcategoryId: SubcategoryId; items: CatalogItem[] }
    >();
    for (const item of results) {
      const key = `${item.category}::${item.subcategory}`;
      const bucket = map.get(key) ?? {
        categoryId: item.category,
        subcategoryId: item.subcategory,
        items: [],
      };
      bucket.items.push(item);
      map.set(key, bucket);
    }
    return Array.from(map.values()).sort((a, b) => {
      const ca = CATEGORIES.findIndex((c) => c.id === a.categoryId);
      const cb = CATEGORIES.findIndex((c) => c.id === b.categoryId);
      if (ca !== cb) return ca - cb;
      const cat = getCategory(a.categoryId);
      const sa = cat?.subcategories.findIndex((s) => s.id === a.subcategoryId) ?? 0;
      const sb = cat?.subcategories.findIndex((s) => s.id === b.subcategoryId) ?? 0;
      return sa - sb;
    });
  }, [results]);

  const selectCategory = (id: CategoryId | "all") => {
    startTransition(() => {
      setCategory(id);
      setSubcategory("all");
    });
    track("category_filter", { category: id });
  };

  const clearFilters = () => {
    startTransition(() => {
      setQuery("");
      setCategory("all");
      setSubcategory("all");
      setKind("all");
      setPlatform("all");
      setBrand("all");
      setSort("newest");
    });
    track("category_filter", { cleared: true });
  };

  return (
    <section id="categories" className="section categories" aria-labelledby="categories-title">
      <header className="section__head">
        <div>
          <p className="section__eyebrow">index://taxonomy</p>
          <h2 id="categories-title">CATEGORIES</h2>
        </div>
        <p className="section__aside">
          Filter the stream. Original platform artwork loads with each title.
        </p>
      </header>

      <div className="cat-search">
        <label className="cat-search__label" htmlFor="category-search">
          search_
        </label>
        <input
          id="category-search"
          className="cat-search__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="essays · podcast · golden crow · grungezhou · live…"
          autoComplete="off"
          spellCheck={false}
        />
        <span className="cat-search__count">
          {results.length}/{CATALOG.length}
          {filterCount ? ` · ${filterCount} filters` : ""}
        </span>
      </div>

      <div className="cat-filters" aria-label="Additional filters">
        <label className="cat-filters__field">
          <span>kind</span>
          <select
            value={kind}
            onChange={(e) => {
              const next = e.target.value as MediaKind | "all";
              setKind(next);
              track("category_filter", { kind: next });
            }}
          >
            <option value="all">all kinds</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="cat-filters__field">
          <span>platform</span>
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              track("category_filter", { platform: e.target.value });
            }}
          >
            <option value="all">all platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="cat-filters__field">
          <span>brand</span>
          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              track("category_filter", { brand: e.target.value });
            }}
          >
            <option value="all">all brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="cat-filters__field">
          <span>sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
            <option value="newest">newest</option>
            <option value="oldest">oldest</option>
            <option value="title">title a–z</option>
            <option value="brand">brand a–z</option>
          </select>
        </label>
        <button type="button" className="cat-filters__clear" onClick={clearFilters}>
          clear filters
        </button>
      </div>

      <div className="cat-tabs" role="tablist" aria-label="Categories">
        <button
          type="button"
          role="tab"
          aria-selected={category === "all"}
          className={`cat-tabs__btn ${category === "all" ? "is-on" : ""}`}
          onClick={() => selectCategory("all")}
        >
          all
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={category === cat.id}
            className={`cat-tabs__btn ${category === cat.id ? "is-on" : ""}`}
            onClick={() => selectCategory(cat.id)}
            title={cat.hint}
          >
            {cat.label.toLowerCase()}
          </button>
        ))}
      </div>

      {subOptions.length > 0 ? (
        <div className="cat-subs" role="tablist" aria-label="Subcategories">
          <button
            type="button"
            role="tab"
            aria-selected={subcategory === "all"}
            className={`cat-subs__btn ${subcategory === "all" ? "is-on" : ""}`}
            onClick={() => setSubcategory("all")}
          >
            all {activeCategory?.label.toLowerCase()}
          </button>
          {subOptions.map((sub) => (
            <button
              key={sub.id}
              type="button"
              role="tab"
              aria-selected={subcategory === sub.id}
              className={`cat-subs__btn ${subcategory === sub.id ? "is-on" : ""}`}
              onClick={() => setSubcategory(sub.id)}
            >
              {sub.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="cat-subs cat-subs--map" aria-label="Subcategory map">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="cat-map">
              <button type="button" className="cat-map__head" onClick={() => selectCategory(cat.id)}>
                <strong>{cat.label}</strong>
                <span>{cat.hint}</span>
              </button>
              <div className="cat-map__subs">
                {cat.subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      setSubcategory(sub.id);
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cat-results">
        {grouped.length === 0 ? (
          <p className="cat-empty">no signal for current filters</p>
        ) : (
          grouped.map((group) => {
            const cat = getCategory(group.categoryId);
            const sub = getSubcategory(group.categoryId, group.subcategoryId);
            return (
              <article key={`${group.categoryId}-${group.subcategoryId}`} className="cat-group">
                <header className="cat-group__head">
                  <div>
                    <p className="cat-group__path">
                      {cat?.label ?? group.categoryId}
                      <span>/</span>
                      {sub?.label ?? group.subcategoryId}
                    </p>
                    <h3>
                      {sub?.label ?? group.subcategoryId}
                      <small>{group.items.length}</small>
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="cat-group__focus"
                    onClick={() => {
                      setCategory(group.categoryId);
                      setSubcategory(group.subcategoryId);
                    }}
                  >
                    isolate
                  </button>
                </header>
                <div className="cat-group__track">
                  {group.items.map((item) => (
                    <div key={item.id} className="tile-wrap">
                      <button
                        type="button"
                        className={`tile tile--compact ${current?.id === item.id ? "tile--active" : ""}`}
                        onClick={() => playItem(item, group.items)}
                      >
                        <div className={`tile__art tile__art--${item.kind}`} aria-hidden>
                          <MediaPoster item={item} className="tile__poster" label={kindGlyph(item.kind)} />
                          {isPaywalled(item) ? <span className="tile__badge">pay</span> : null}
                        </div>
                        <div className="tile__meta">
                          <p className="tile__brand">{item.brand}</p>
                          <h4 className="tile__title">{item.title}</h4>
                          <p className="tile__sub">
                            {item.subcategory} · {item.kind} · {item.platform}
                          </p>
                        </div>
                      </button>
                      {hasMagazine(item.id) ? (
                        <button
                          type="button"
                          className="tile__mag"
                          onClick={() => openMagazine(item.id)}
                        >
                          magazine view
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
