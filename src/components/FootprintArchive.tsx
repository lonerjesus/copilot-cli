"use client";

import { useEffect, useMemo, useState } from "react";
import { CATALOG, type CatalogItem, type MediaKind } from "@/data/catalog";
import type { FootprintItem } from "@/lib/feed";
import { decodeEntities, relativePulse } from "@/lib/format";
import { usePlayerState } from "@/components/player/PlayerContext";
import { useMagazine } from "@/components/MagazineContext";
import { MediaPoster } from "@/components/MediaPoster";
import { track } from "@/lib/analytics";

type FootprintArchiveProps = {
  initial: FootprintItem[];
};

function posterItem(item: FootprintItem, catalog: CatalogItem[]): CatalogItem {
  const hit = catalog.find(
    (c) =>
      c.externalUrl.replace(/\/$/, "") === item.url.replace(/\/$/, "") ||
      c.title === item.title ||
      item.id === `catalog:${c.id}`,
  );
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
  const [liveCatalog, setLiveCatalog] = useState<CatalogItem[]>(CATALOG);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const [feedRes, catRes] = await Promise.all([
          fetch("/api/feed"),
          fetch("/api/catalog"),
        ]);
        if (feedRes.ok) {
          const data = (await feedRes.json()) as { items: FootprintItem[] };
          if (alive && data.items?.length) setItems(data.items);
        }
        if (catRes.ok) {
          const data = (await catRes.json()) as { items: CatalogItem[] };
          if (alive && data.items?.length) setLiveCatalog(data.items);
        }
      } catch {
        /* keep seed */
      }
    };
    void refresh();
    const id = window.setInterval(refresh, 5 * 60 * 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const matchLive = (item: FootprintItem): CatalogItem | undefined => {
    return liveCatalog.find(
      (c) =>
        c.externalUrl.replace(/\/$/, "") === item.url.replace(/\/$/, "") ||
        c.title === item.title ||
        item.id === `catalog:${c.id}`,
    );
  };

  const platforms = useMemo(() => {
    const set = new Set(items.map((i) => i.platform));
    return ["all", ...Array.from(set)];
  }, [items]);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.platform === filter);
  }, [items, filter]);

  const openItem = (item: FootprintItem) => {
    track("footprint_open", { id: item.id, platform: item.platform });
    const catalogMatch = matchLive(item);
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
          <h1 id="footprint-title" className="footprint__page-title">
            FOOTPRINT
          </h1>
        </div>
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
        <p className="footprint__count" aria-live="polite">
          {visible.length}
        </p>
      </div>

      <div className="footprint__grid">
        {visible.map((item) => {
          const catalog = matchLive(item);
          const active = catalog ? current?.id === catalog.id : false;
          const art = posterItem(item, liveCatalog);
          const title = decodeEntities(item.title);
          return (
            <article
              key={item.id}
              className={`floppy ${active ? "floppy--active" : ""}`}
            >
              <button
                type="button"
                className="floppy__hit"
                onClick={() => openItem(item)}
                aria-pressed={active}
                aria-label={`${title} · ${item.platformLabel}`}
              >
                <div className="floppy__shell" aria-hidden>
                  <div className="floppy__shutter">
                    <span className="floppy__metal" />
                    <span className="floppy__slot" />
                  </div>
                  <div className="floppy__notch" />
                  <div className="floppy__hub" />
                  <div className="floppy__label">
                    <div className="floppy__art">
                      <MediaPoster item={art} className="tile__poster" />
                    </div>
                    <div className="floppy__ink">
                      <span className="floppy__platform">{item.platformLabel}</span>
                      <h2 className="floppy__title">{title}</h2>
                      <p className="floppy__meta">{relativePulse(item.publishedAt)}</p>
                    </div>
                  </div>
                </div>
              </button>
            </article>
          );
        })}
      </div>

      {visible.length === 0 ? <p className="footprint__empty">—</p> : null}
    </section>
  );
}
