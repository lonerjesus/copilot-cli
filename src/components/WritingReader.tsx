"use client";

import { useEffect, useMemo } from "react";
import type { CatalogItem } from "@/data/catalog";
import { kindLabel } from "@/lib/format";
import { ContentPayActions } from "@/components/ContentPayActions";
import { MediaPoster } from "@/components/MediaPoster";

function paragraphs(body?: string, blurb?: string): string[] {
  const raw = (body || blurb || "").trim();
  if (!raw) return [];
  return raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

type WritingReaderProps = {
  item: CatalogItem | null;
  onClose: () => void;
};

export function WritingReader({ item, onClose }: WritingReaderProps) {
  const paras = useMemo(
    () => (item ? paragraphs(item.body, item.blurb) : []),
    [item],
  );

  useEffect(() => {
    if (!item) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="writing-reader"
      role="dialog"
      aria-modal="true"
      aria-labelledby="writing-reader-title"
    >
      <div className="writing-reader__chrome">
        <div className="writing-reader__mast">
          <span>{kindLabel(item.kind)}</span>
          <span>{item.publishedAt}</span>
          {item.platform ? <span>{item.platform}</span> : null}
        </div>
        <button type="button" className="writing-reader__close" onClick={onClose}>
          close ✕
        </button>
      </div>

      <article className="writing-reader__sheet">
        {item.poster || item.kind === "still" ? (
          <div className="writing-reader__poster" aria-hidden>
            <MediaPoster
              item={item}
              className="writing-reader__poster-img"
              label={kindLabel(item.kind)}
            />
          </div>
        ) : null}

        <header className="writing-reader__head">
          <p className="writing-reader__kicker">{item.brand}</p>
          <h2 id="writing-reader-title">{item.title}</h2>
          {item.subtitle ? <p className="writing-reader__dek">{item.subtitle}</p> : null}
        </header>

        <div className="writing-reader__pay">
          <ContentPayActions catalogId={item.id} title={item.title} />
        </div>

        {paras.length ? (
          <div className="writing-reader__body">
            {paras.map((para, i) => (
              <p key={`${i}-${para.slice(0, 24)}`}>{para}</p>
            ))}
          </div>
        ) : (
          <p className="writing-reader__empty">No body on this note yet.</p>
        )}

        {item.tags?.length ? (
          <footer className="writing-reader__tags">
            {item.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </footer>
        ) : null}
      </article>
    </div>
  );
}
