"use client";

import {
  useCallback,
  useMemo,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  STREAM_ROWS,
  isPaywalled,
  isPlayableMedia,
  playableCatalog,
  streamRowMatches,
  type CatalogItem,
} from "@/data/catalog";
import { kindGlyph, kindLabel } from "@/lib/format";
import { usePlayerState } from "@/components/player/PlayerContext";
import { useReader } from "@/components/ReaderContext";
import { MediaPoster } from "@/components/MediaPoster";
import { track } from "@/lib/analytics";
import { useLiveCatalog } from "@/components/useLiveCatalog";

function Tile({
  item,
  active,
  featured = false,
  onActivate,
  onQueueNext,
}: {
  item: CatalogItem;
  active: boolean;
  featured?: boolean;
  onActivate: () => void;
  onQueueNext?: () => void;
}) {
  const paid = isPaywalled(item);
  const playable = isPlayableMedia(item);
  const readable = !playable && (item.kind === "writing" || item.kind === "still" || Boolean(item.body));
  return (
    <div
      className={`tile-wrap ${active ? "tile-wrap--active" : ""} ${featured ? "tile-wrap--featured" : ""}`}
    >
      <button
        type="button"
        className={`tile ${active ? "tile--active" : ""} ${featured ? "tile--featured" : ""}`}
        onClick={onActivate}
        aria-pressed={playable ? active : undefined}
        aria-label={`${playable ? "Play" : readable ? "Open" : "Select"} ${item.title}`}
      >
        <div className={`tile__art tile__art--${item.kind}`} aria-hidden>
          <MediaPoster item={item} className="tile__poster" label={kindGlyph(item.kind)} />
          <span className="tile__scan" />
          {playable ? (
            <span className="tile__playhint" aria-hidden>
              ▶
            </span>
          ) : readable ? (
            <span className="tile__playhint tile__playhint--read" aria-hidden>
              ▦
            </span>
          ) : null}
          {paid ? <span className="tile__badge">pay</span> : null}
        </div>
        <div className="tile__meta">
          <h3 className="tile__title">{item.title}</h3>
          <p className="tile__sub">
            {kindLabel(item.kind)}
            {playable && item.duration ? ` · ${item.duration}` : ""}
          </p>
        </div>
      </button>
      {playable && onQueueNext ? (
        <div className="tile__actions">
          <button
            type="button"
            className="tile__next"
            onClick={(e) => {
              e.stopPropagation();
              onQueueNext();
            }}
            title="Play next"
            aria-label={`Play ${item.title} next`}
          >
            + next
          </button>
        </div>
      ) : null}
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
  const { openReadable, isReadable } = useReader();
  const { items: house } = useLiveCatalog();

  const shelves = useMemo(
    () =>
      STREAM_ROWS.map((row) => ({
        row,
        items: rowItems(row.id, row.itemIds, house),
      })),
    [house],
  );

  const activate = useCallback(
    (item: CatalogItem, queue: CatalogItem[], via: string) => {
      track("enter_stream", { id: item.id, via });
      if (!isPlayableMedia(item)) {
        openReadable(item, queue);
        return;
      }
      playItem(item, playableCatalog(queue));
    },
    [openReadable, playItem],
  );

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

      {shelves.map(({ row, items }) => {
        const featured = row.id === "now";
        const hero = featured && items.length ? items[0] : null;
        const shelfItems = featured ? items.slice(1) : items;
        const empty = items.length === 0;

        return (
          <div
            key={row.id}
            className={`row ${featured ? "row--featured" : ""} ${empty ? "row--empty" : ""}`}
          >
            <div className="row__head">
              <div>
                <h3>{featured ? "FEATURED" : row.title}</h3>
                {row.hint ? <span className="row__hint">{row.hint}</span> : null}
              </div>
            </div>

            {empty ? (
              <p className="row__empty">
                No {row.title.toLowerCase()} yet.
              </p>
            ) : null}

            {hero ? (
              <div className="featured">
                <button
                  type="button"
                  className={`featured__card ${current?.id === hero.id ? "is-active" : ""}`}
                  onClick={() => activate(hero, items, "featured")}
                  aria-label={`${
                    isPlayableMedia(hero) ? "Play" : isReadable(hero) ? "Open" : "Select"
                  } ${hero.title}`}
                >
                  <div className={`featured__art tile__art--${hero.kind}`} aria-hidden>
                    <MediaPoster item={hero} className="tile__poster" label={kindGlyph(hero.kind)} />
                    {isPlayableMedia(hero) ? (
                      <span className="featured__play" aria-hidden>
                        ▶
                      </span>
                    ) : isReadable(hero) ? (
                      <span className="featured__play featured__play--read" aria-hidden>
                        ▦
                      </span>
                    ) : null}
                  </div>
                  <div className="featured__meta">
                    <p className="featured__eyebrow">
                      {kindGlyph(hero.kind)} {kindLabel(hero.kind)}
                    </p>
                    <h4 className="featured__title">{hero.title}</h4>
                    {hero.subtitle ? <p className="featured__sub">{hero.subtitle}</p> : null}
                    {hero.blurb &&
                    hero.blurb.trim().toLowerCase() !== (hero.subtitle ?? "").trim().toLowerCase() &&
                    hero.blurb.trim().toLowerCase() !== hero.title.trim().toLowerCase() ? (
                      <p className="featured__blurb">{hero.blurb}</p>
                    ) : null}
                    <p className="featured__cta">
                      {isPlayableMedia(hero)
                        ? "play · queue"
                        : isReadable(hero)
                          ? "open · read"
                          : "open · view"}
                    </p>
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
                      onActivate={() => activate(item, items, "shelf")}
                      onQueueNext={
                        isPlayableMedia(item)
                          ? () => {
                              track("queue_next", { id: item.id });
                              queueNext(item);
                            }
                          : undefined
                      }
                    />
                  </div>
                ))}
              </ShelfTrack>
            ) : null}
          </div>
        );
      })}

      {house.length === 0 ? (
        <p className="stream__empty stream__empty--upscale">
          <span className="stream__empty-mark" aria-hidden>
            ◈
          </span>
          <span>Empty shelf — publish the next drop from admin.</span>
        </p>
      ) : null}
    </section>
  );
}
