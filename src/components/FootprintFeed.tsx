"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FootprintItem } from "@/lib/feed";
import { formatStamp, kindGlyph, relativePulse } from "@/lib/format";
import { CATALOG } from "@/data/catalog";
import { usePlayerState } from "@/components/player/PlayerContext";

type FootprintFeedProps = {
  initial: FootprintItem[];
};

export function FootprintFeed({ initial }: FootprintFeedProps) {
  const { playItem } = usePlayerState();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<string>("all");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

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
    // Honor SSR seed; only poll for updates
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

  const visible = useMemo(() => {
    const filtered = filter === "all" ? items : items.filter((i) => i.platform === filter);
    return filtered.slice(0, Math.max(12, cursor + 12));
  }, [items, filter, cursor]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key === "j") setCursor((c) => Math.min(c + 1, items.length - 1));
      if (event.key === "k") setCursor((c) => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length]);

  useEffect(() => {
    const node = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [cursor]);

  const openItem = (item: FootprintItem) => {
    const catalogMatch = CATALOG.find(
      (c) =>
        c.externalUrl.replace(/\/$/, "") === item.url.replace(/\/$/, "") ||
        c.title === item.title,
    );
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
    try {
      const url = new URL(item.url);
      if (url.protocol !== "https:") return;
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch {
      /* ignore unsafe */
    }
  };

  return (
    <section id="footprint" className="section footprint" aria-labelledby="footprint-title">
      <header className="section__head">
        <div>
          <p className="section__eyebrow">signal://footprint</p>
          <h2 id="footprint-title">CHRONIC FEED</h2>
        </div>
        <p className="section__aside">
          Online footprint as a live terminal stream — not a timeline clone. j/k to move, enter via click.
        </p>
      </header>

      <div className="footprint__filters" role="tablist" aria-label="Filter platforms">
        {platforms.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={filter === p}
            className={`footprint__filter ${filter === p ? "is-on" : ""}`}
            onClick={() => {
              setFilter(p);
              setCursor(0);
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="footprint__ticker" aria-hidden>
        <div className="footprint__ticker-track">
          {[...items, ...items].slice(0, 24).map((item, i) => (
            <span key={`${item.id}-${i}`}>
              {relativePulse(item.publishedAt)} · {item.platformLabel} · {item.title}
            </span>
          ))}
        </div>
      </div>

      <div className="footprint__list" ref={listRef}>
        {visible.map((item, idx) => (
          <article
            key={item.id}
            data-idx={idx}
            className={`pulse ${idx === cursor ? "pulse--focus" : ""}`}
            onMouseEnter={() => setCursor(idx)}
          >
            <button type="button" className="pulse__hit" onClick={() => openItem(item)}>
              <div className="pulse__rail">
                <span className="pulse__kind">{kindGlyph(item.kind)}</span>
                <span className="pulse__age">{relativePulse(item.publishedAt)}</span>
              </div>
              <div className="pulse__body">
                <div className="pulse__top">
                  <span className="pulse__platform">{item.platformLabel}</span>
                  <span className="pulse__stamp">{formatStamp(item.publishedAt)}</span>
                </div>
                <h3>{item.title}</h3>
                {item.brand ? <p className="pulse__brand">{item.brand}</p> : null}
                <p className="pulse__summary">{item.summary}</p>
              </div>
            </button>
          </article>
        ))}
      </div>

      {visible.length < (filter === "all" ? items.length : items.filter((i) => i.platform === filter).length) ? (
        <button
          type="button"
          className="footprint__more"
          onClick={() => setCursor((c) => c + 8)}
        >
          load more signal ↓
        </button>
      ) : null}
    </section>
  );
}
