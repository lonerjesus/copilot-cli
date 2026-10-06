"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  CATALOG,
  STREAM_ROWS,
  houseCatalog,
  isHouseMedia,
  isPaywalled,
  streamRowMatches,
  type CatalogItem,
} from "@/data/catalog";
import { kindGlyph } from "@/lib/format";
import { usePlayerState } from "@/components/player/PlayerContext";
import { useMagazine } from "@/components/MagazineContext";
import { MediaPoster } from "@/components/MediaPoster";
import { track } from "@/lib/analytics";

function Tile({
  item,
  active,
  featured = false,
  onPlay,
  onQueueNext,
  onMagazine,
  canMagazine,
}: {
  item: CatalogItem;
  active: boolean;
  featured?: boolean;
  onPlay: () => void;
  onQueueNext?: () => void;
  onMagazine?: () => void;
  canMagazine?: boolean;
}) {
  const paid = isPaywalled(item);
  return (
    <div
      className={`tile-wrap ${active ? "tile-wrap--active" : ""} ${featured ? "tile-wrap--featured" : ""}`}
    >
      <button
        type="button"
        className={`tile ${active ? "tile--active" : ""} ${featured ? "tile--featured" : ""}`}
        onClick={onPlay}
        aria-pressed={active}
      >
        <div className={`tile__art tile__art--${item.kind}`} aria-hidden>
          <MediaPoster item={item} className="tile__poster" label={kindGlyph(item.kind)} />
          <span className="tile__scan" />
          <span className="tile__playhint" aria-hidden>
            ▶
          </span>
          {paid ? <span className="tile__badge">pay</span> : null}
        </div>
        <div className="tile__meta">
          <p className="tile__brand">{item.brand}</p>
          <h3 className="tile__title">{item.title}</h3>
          <p className="tile__sub">
            {item.kind}
            {item.duration ? ` · ${item.duration}` : ""}
          </p>
        </div>
      </button>
      <div className="tile__actions">
        {onQueueNext ? (
          <button
            type="button"
            className="tile__next"
            onClick={(e) => {
              e.stopPropagation();
              onQueueNext();
            }}
            title="Play next"
          >
            + next
          </button>
        ) : null}
        {canMagazine && onMagazine ? (
          <button type="button" className="tile__mag" onClick={onMagazine}>
            mag
          </button>
        ) : null}
      </div>
    </div>
  );
}

function scrollRow(track: HTMLElement, dir: 1 | -1) {
  const step = Math.max(180, Math.floor(track.clientWidth * 0.72));
  track.scrollBy({ left: dir * step, behavior: "smooth" });
}

function ShelfTrack({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (ref.current) scrollRow(ref.current, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (ref.current) scrollRow(ref.current, -1);
    }
  };

  return (
    <div
      ref={ref}
      className="row__track"
      tabIndex={0}
      role="list"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

function rowItems(rowId: string, pinnedIds: string[], house: CatalogItem[]): CatalogItem[] {
  const byId = new Map(house.map((item) => [item.id, item]));
  const pinned = pinnedIds
    .map((id) => byId.get(id))
    .filter((item): item is CatalogItem => Boolean(item));
  const seen = new Set(pinned.map((i) => i.id));

  if (rowId === "now") {
    const newest = [...house]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    return [...pinned, ...newest].slice(0, 12);
  }

  const extras = house.filter((item) => {
    if (seen.has(item.id)) return false;
    if (!streamRowMatches(rowId, item)) return false;
    seen.add(item.id);
    return true;
  });
  return [...pinned, ...extras];
}

export function StreamDeck({ compact = false }: { compact?: boolean }) {
  const { current, playItem, queueNext } = usePlayerState();
  const { openMagazine, hasMagazine } = useMagazine();
  const [live, setLive] = useState<CatalogItem[]>(() => houseCatalog(CATALOG));

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/catalog");
        if (!res.ok) return;
        const data = (await res.json()) as { items?: CatalogItem[] };
        if (alive && data.items?.length) {
          setLive(houseCatalog(data.items.filter(isHouseMedia)));
        }
      } catch {
        /* seed */
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const house = live;

  return (
    <section
      className={`section stream ${compact ? "section--compact" : ""}`}
      aria-label="Stream"
    >
      {!compact ? (
        <header className="section__head">
          <div>
            <h2 id="stream-title">STREAM</h2>
          </div>
        </header>
      ) : null}

      {STREAM_ROWS.map((row) => {
        const items = rowItems(row.id, row.itemIds, house);
        if (!items.length) return null;
        const featured = row.id === "now";
        const hero = featured ? items[0] : null;
        const shelfItems = featured ? items.slice(1) : items;

        return (
          <div key={row.id} className={`row ${featured ? "row--featured" : ""}`}>
            <div className="row__head">
              <div>
                <h3>{featured ? "FEATURED" : row.title}</h3>
                {row.hint ? <span className="row__hint">{row.hint}</span> : null}
              </div>
            </div>

            {hero ? (
              <div className="featured">
                <button
                  type="button"
                  className={`featured__card ${current?.id === hero.id ? "is-active" : ""}`}
                  onClick={() => {
                    track("enter_stream", { id: hero.id, via: "featured" });
                    playItem(hero, items);
                  }}
                >
                  <div className={`featured__art tile__art--${hero.kind}`} aria-hidden>
                    <MediaPoster item={hero} className="tile__poster" label={kindGlyph(hero.kind)} />
                    <span className="featured__play" aria-hidden>
                      ▶
                    </span>
                  </div>
                  <div className="featured__meta">
                    <p className="featured__eyebrow">
                      {kindGlyph(hero.kind)} {hero.kind} · {hero.platform}
                    </p>
                    <h4 className="featured__title">{hero.title}</h4>
                    {hero.subtitle ? <p className="featured__sub">{hero.subtitle}</p> : null}
                    <p className="featured__blurb">{hero.blurb}</p>
                    <p className="featured__cta">press play · queue follows</p>
                  </div>
                </button>
              </div>
            ) : null}

            {shelfItems.length ? (
              <ShelfTrack label={row.title}>
                {shelfItems.map((item) => (
                  <div key={item.id} role="listitem">
                    <Tile
                      item={item}
                      featured={featured}
                      active={current?.id === item.id}
                      onPlay={() => {
                        track("enter_stream", { id: item.id, via: "shelf" });
                        playItem(item, items);
                      }}
                      onQueueNext={() => {
                        track("queue_next", { id: item.id });
                        queueNext(item);
                      }}
                      canMagazine={hasMagazine(item.id)}
                      onMagazine={() => openMagazine(item.id)}
                    />
                  </div>
                ))}
              </ShelfTrack>
            ) : null}
          </div>
        );
      })}

      {house.length === 0 ? (
        <p className="stream__empty">House stream is empty — check back after the next drop.</p>
      ) : null}
    </section>
  );
}
