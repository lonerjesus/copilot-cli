"use client";

import { CATALOG, STREAM_ROWS, isPaywalled, type CatalogItem } from "@/data/catalog";
import { kindGlyph } from "@/lib/format";
import { usePlayerState } from "@/components/player/PlayerContext";
import { useMagazine } from "@/components/MagazineContext";
import { MediaPoster } from "@/components/MediaPoster";

function Tile({
  item,
  active,
  onPlay,
  onMagazine,
  canMagazine,
}: {
  item: CatalogItem;
  active: boolean;
  onPlay: () => void;
  onMagazine?: () => void;
  canMagazine?: boolean;
}) {
  const paid = isPaywalled(item);
  return (
    <div className={`tile-wrap ${active ? "tile-wrap--active" : ""}`}>
      <button
        type="button"
        className={`tile ${active ? "tile--active" : ""}`}
        onClick={onPlay}
        aria-pressed={active}
      >
        <div className={`tile__art tile__art--${item.kind}`} aria-hidden>
          <MediaPoster item={item} className="tile__poster" label={kindGlyph(item.kind)} />
          <span className="tile__scan" />
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
      {canMagazine && onMagazine ? (
        <button type="button" className="tile__mag" onClick={onMagazine}>
          magazine
        </button>
      ) : null}
    </div>
  );
}

export function StreamDeck({ compact = false }: { compact?: boolean }) {
  const { current, playItem } = usePlayerState();
  const { openMagazine, hasMagazine } = useMagazine();

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
        const items = row.itemIds
          .map((id) => CATALOG.find((c) => c.id === id))
          .filter((item): item is CatalogItem => Boolean(item));
        return (
          <div key={row.id} className="row">
            <div className="row__head">
              <h3>{row.title}</h3>
            </div>
            <div className="row__track" tabIndex={0}>
              {items.map((item) => (
                <Tile
                  key={item.id}
                  item={item}
                  active={current?.id === item.id}
                  onPlay={() => playItem(item, items)}
                  canMagazine={hasMagazine(item.id)}
                  onMagazine={() => openMagazine(item.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
