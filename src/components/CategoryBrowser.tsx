"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { CATALOG, type CatalogItem } from "@/data/catalog";
import {
  CATEGORIES,
  getCategory,
  getSubcategory,
  type CategoryId,
  type SubcategoryId,
} from "@/data/taxonomy";
import { filterCatalog } from "@/lib/search";
import { kindGlyph } from "@/lib/format";
import { usePlayer } from "@/components/player/PlayerContext";

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
  const { current, playItem } = usePlayer();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryId | "all">(initialCategory);
  const [subcategory, setSubcategory] = useState<SubcategoryId | "all">(initialSubcategory);
  const deferredQuery = useDeferredValue(query);

  const activeCategory = category === "all" ? undefined : getCategory(category);
  const subOptions = activeCategory?.subcategories ?? [];

  const results = useMemo(
    () =>
      filterCatalog({
        query: deferredQuery,
        category,
        subcategory,
      }),
    [deferredQuery, category, subcategory],
  );

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
    setCategory(id);
    setSubcategory("all");
  };

  return (
    <section id="categories" className="section categories" aria-labelledby="categories-title">
      <header className="section__head">
        <div>
          <p className="section__eyebrow">index://taxonomy</p>
          <h2 id="categories-title">CATEGORIES</h2>
        </div>
        <p className="section__aside">
          Separated by category and subcategory. Search titles, brands, tags, or type a category
          name.
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
          placeholder="essays · podcast · grungezhou · streetpolitik · live…"
          autoComplete="off"
          spellCheck={false}
        />
        <span className="cat-search__count">
          {results.length}/{CATALOG.length}
        </span>
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
          <p className="cat-empty">no signal for “{deferredQuery || "filters"}”</p>
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
                    <button
                      key={item.id}
                      type="button"
                      className={`tile tile--compact ${current?.id === item.id ? "tile--active" : ""}`}
                      onClick={() => playItem(item, group.items)}
                    >
                      <div className={`tile__art tile__art--${item.kind}`} aria-hidden>
                        <span className="tile__glyph">{kindGlyph(item.kind)}</span>
                      </div>
                      <div className="tile__meta">
                        <p className="tile__brand">{item.brand}</p>
                        <h4 className="tile__title">{item.title}</h4>
                        <p className="tile__sub">
                          {item.subcategory} · {item.kind} · {item.platform}
                        </p>
                      </div>
                    </button>
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
