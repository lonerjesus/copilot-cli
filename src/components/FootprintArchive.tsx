"use client";

import { useEffect, useMemo, useState } from "react";
import { CATALOG, type CatalogItem, type MediaKind } from "@/data/catalog";
import type { FootprintItem } from "@/lib/feed";
import { formatStamp, kindGlyph, relativePulse } from "@/lib/format";
import { usePlayerState } from "@/components/player/PlayerContext";
import { useMagazine } from "@/components/MagazineContext";
import { MediaPoster } from "@/components/MediaPoster";
import { track } from "@/lib/analytics";

type FootprintArchiveProps = {
  initial: FootprintItem[];
};

function matchCatalog(item: FootprintItem): CatalogItem | undefined {
  return CATALOG.find(
    (c) =>
      c.externalUrl.replace(/\/$/, "") === item.url.replace(/\/$/, "") ||
      c.title === item.title ||
      item.id === `catalog:${c.id}`,
  );
}

function posterItem(item: FootprintItem): CatalogItem {
  const hit = matchCatalog(item);
  if (hit) return hit;
  const kind = (["video", "audio", "vlog", "essay", "still", "live"].includes(item.kind)
    ? item.kind
    : "essay") as MediaKind;
  return {
    id: item.id,
    title: item.title,
    brand: item.brand ?? item.platformLabel,
    kind,
    category: "writing",
    subcategory: "essays",
    publishedAt: item.publishedAt,
    platform: item.platform,
    externalUrl: item.url,
    source: "fetched",
    tags: [item.platform],
    blurb: item.summary,
  };
}

export function FootprintArchive({ initial }: FootprintArchiveProps) {
  const { playItem, current } = usePlayerState();
  const { openMagazine, hasMagazine } = useMagazine();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<string>("all");

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const res = await fetch("/api/feed");
        if (!res.ok) return;
        const data = (await res.json()) as { items: FootprintItem[] };
        if (alive && data.items?.length) setItems(data.items);
      } catch {
        /* keep seed */
      }
    };
    const id = window.setInterval(refresh, 5 * 60 * 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const platforms = useMemo(() => {
    const set = new Set(items.map((i) => i.platform));
    return ["all", ...Array.from(set)];
  }, [items]);

  const kinds = useMemo(() => {
    const set = new Set(items.map((i) => i.kind));
    return ["all", ...Array.from(set)];
  }, [items]);

  const visible = useMemo(() => {
    return items.filter((item) => {
      if (filter !== "all" && item.platform !== filter) return false;
      if (kindFilter !== "all" && item.kind !== kindFilter) return false;
      return true;
    });
  }, [items, filter, kindFilter]);

  const openItem = (item: FootprintItem) => {
    track("footprint_open", { id: item.id, platform: item.platform });
    const catalogMatch = matchCatalog(item);
    if (
      catalogMatch &&
      (catalogMatch.kind === "audio" ||
        catalogMatch.kind === "video" ||
        catalogMatch.kind === "live" ||
        catalogMatch.kind === "vlog")
    ) {
      playItem(catalogMatch);
      return;
    }
    if (catalogMatch && hasMagazine(catalogMatch.id)) {
      openMagazine(catalogMatch.id);
      return;
    }
    try {
      const url = new URL(item.url);
      if (url.protocol !== "https:") return;
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch {
      /* ignore unsafe */
    }
  };

  return (
    <section className="section footprint footprint--archive" aria-labelledby="footprint-title">
      <header className="section__head">
        <div>
          <p className="section__eyebrow">signal://footprint</p>
          <h1 id="footprint-title" className="footprint__page-title">
            WATCH FOOTPRINT
          </h1>
        </div>
        <p className="section__aside">
          Every archived post and media signal — organized as cards. Filter by platform or kind,
          then open in-deck or outbound.
        </p>
      </header>

      <div className="footprint__toolbar">
        <div className="footprint__filters" role="tablist" aria-label="Filter platforms">
          {platforms.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={filter === p}
              className={`footprint__filter ${filter === p ? "is-on" : ""}`}
              onClick={() => setFilter(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="footprint__filters" role="tablist" aria-label="Filter kinds">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kindFilter === k}
              className={`footprint__filter ${kindFilter === k ? "is-on" : ""}`}
              onClick={() => setKindFilter(k)}
            >
              {k}
            </button>
          ))}
        </div>
        <p className="footprint__count" aria-live="polite">
          {visible.length} signal{visible.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="footprint__grid">
        {visible.map((item) => {
          const catalog = matchCatalog(item);
          const active = catalog ? current?.id === catalog.id : false;
          const art = posterItem(item);
          return (
            <article
              key={item.id}
              className={`fp-card ${active ? "fp-card--active" : ""}`}
            >
              <button
                type="button"
                className="fp-card__hit"
                onClick={() => openItem(item)}
                aria-pressed={active}
              >
                <div className={`fp-card__art tile__art--${item.kind}`} aria-hidden>
                  <MediaPoster
                    item={art}
                    className="tile__poster"
                    label={kindGlyph(item.kind)}
                  />
                  <span className="tile__scan" />
                  <span className="fp-card__age">{relativePulse(item.publishedAt)}</span>
                </div>
                <div className="fp-card__meta">
                  <div className="fp-card__top">
                    <span className="fp-card__platform">{item.platformLabel}</span>
                    <span className="fp-card__stamp">{formatStamp(item.publishedAt)}</span>
                  </div>
                  {item.brand ? <p className="fp-card__brand">{item.brand}</p> : null}
                  <h2 className="fp-card__title">{item.title}</h2>
                  <p className="fp-card__summary">{item.summary}</p>
                  <p className="fp-card__kind">
                    {kindGlyph(item.kind)} {item.kind}
                    {item.source === "rss" ? " · live feed" : " · archive"}
                  </p>
                </div>
              </button>
            </article>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="footprint__empty">No signals match these filters.</p>
      ) : null}
    </section>
  );
}
