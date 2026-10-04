"use client";

import { CATALOG, STREAM_ROWS, type CatalogItem } from "@/data/catalog";
import { kindGlyph } from "@/lib/format";
import { usePlayer } from "@/components/player/PlayerContext";

function Tile({
  item,
  active,
  onPlay,
}: {
  item: CatalogItem;
  active: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      className={`tile ${active ? "tile--active" : ""}`}
      onClick={onPlay}
      aria-pressed={active}
    >
      <div className={`tile__art tile__art--${item.kind}`} aria-hidden>
        <span className="tile__glyph">{kindGlyph(item.kind)}</span>
        <span className="tile__scan" />
      </div>
      <div className="tile__meta">
        <p className="tile__brand">{item.brand}</p>
        <h3 className="tile__title">{item.title}</h3>
        <p className="tile__sub">
          {item.category}/{item.subcategory}
          {` · ${item.kind}`}
          {item.duration ? ` · ${item.duration}` : ""}
        </p>
      </div>
    </button>
  );
}

export function StreamDeck() {
  const { current, playItem } = usePlayer();

  return (
    <section id="stream" className="section stream" aria-labelledby="stream-title">
      <header className="section__head">
        <div>
          <p className="section__eyebrow">channel://portfolio</p>
          <h2 id="stream-title">STREAM DECK</h2>
        </div>
        <p className="section__aside">
          Browse like a streaming platform. Select anything — the custom deck keeps you in-flow.
        </p>
      </header>

      {STREAM_ROWS.map((row) => {
        const items = row.itemIds
          .map((id) => CATALOG.find((c) => c.id === id))
          .filter((item): item is CatalogItem => Boolean(item));
        return (
          <div key={row.id} className="row">
            <div className="row__head">
              <h3>{row.title}</h3>
              <span>{row.hint}</span>
            </div>
            <div className="row__track" tabIndex={0}>
              {items.map((item) => (
                <Tile
                  key={item.id}
                  item={item}
                  active={current?.id === item.id}
                  onPlay={() => playItem(item, items)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
