"use client";

import { useMemo } from "react";
import { CATALOG } from "@/data/catalog";
import { kindGlyph } from "@/lib/format";
import { usePlayer } from "@/components/player/PlayerContext";

/** Persistent "keep going" continuum under the hero — reduces bounce via always-on next picks. */
export function ContinuumRail() {
  const { current, playItem, playing } = usePlayer();

  const picks = useMemo(() => {
    const pool = [...CATALOG].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    if (!current) return pool.slice(0, 8);
    const rest = pool.filter((item) => item.id !== current.id);
    return [current, ...rest].slice(0, 8);
  }, [current]);

  return (
    <section className="continuum" aria-label="Continue watching continuum">
      <div className="continuum__head">
        <p>
          <span className="continuum__pulse" data-live={playing ? "1" : "0"} />
          {playing ? "in flow" : "press play · stay in the continuum"}
        </p>
        <a href="#categories">browse all →</a>
      </div>
      <div className="continuum__track">
        {picks.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`continuum__chip ${current?.id === item.id ? "is-on" : ""}`}
            onClick={() => playItem(item, picks)}
          >
            <span className="continuum__idx">{String(index + 1).padStart(2, "0")}</span>
            <span className="continuum__glyph">{kindGlyph(item.kind)}</span>
            <span className="continuum__copy">
              <strong>{item.title}</strong>
              <small>
                {item.brand} · {item.category}/{item.subcategory}
              </small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
