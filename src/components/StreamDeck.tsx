"use client";

import { CATALOG, STREAM_ROWS, type CatalogItem } from "@/data/catalog";
import { kindGlyph } from "@/lib/format";
import { usePlayer } from "@/components/player/PlayerContext";
import { useMagazine } from "@/components/MagazineContext";

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
  return (
    <div className={`tile-wrap ${active ? "tile-wrap--active" : ""}`}>
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
      {canMagazine && onMagazine ? (
        <button type="button" className="tile__mag" onClick={onMagazine}>
          magazine view
        </button>
      ) : null}
    </div>
  );
}

export function StreamDeck() {
  const { current, playItem } = usePlayer();
  const { openMagazine, hasMagazine } = useMagazine();

  return (
    <section id="stream" className="section stream" aria-labelledby="stream-title">
      <header className="section__head">
        <div>
          <p className="section__eyebrow">channel://portfolio</p>
          <h2 id="stream-title">STREAM DECK</h2>
        </div>
        <p className="section__aside">
          Everything posted under your names — stream, chapbooks, podcasts. Open magazine view for
          words.
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
