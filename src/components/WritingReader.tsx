"use client";

import { useEffect, useMemo, useState } from "react";
import type { CatalogItem } from "@/data/catalog";
import { isReadableText } from "@/data/catalog";
import { kindLabel } from "@/lib/format";
import { ContentPayActions } from "@/components/ContentPayActions";
import { MediaPoster } from "@/components/MediaPoster";
import { useLiveCatalog } from "@/components/useLiveCatalog";
import { useReader } from "@/components/ReaderContext";
import { PLATFORMS, SITE } from "@/data/identity";
import { track } from "@/lib/analytics";

function paragraphs(body?: string, blurb?: string): string[] {
  const raw = (body || blurb || "").trim();
  if (!raw) return [];
  return raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function relatedFor(item: CatalogItem, house: CatalogItem[], limit = 4): CatalogItem[] {
  const tagSet = new Set((item.tags ?? []).map((t) => t.toLowerCase()));
  const scored = house
    .filter((peer) => peer.id !== item.id && isReadableText(peer))
    .map((peer) => {
      let score = 0;
      if (peer.brand && item.brand && peer.brand === item.brand) score += 3;
      for (const t of peer.tags ?? []) {
        if (tagSet.has(t.toLowerCase())) score += 1;
      }
      if (peer.kind === item.kind) score += 0.5;
      return { peer, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || b.peer.publishedAt.localeCompare(a.peer.publishedAt));
  return scored.slice(0, limit).map((row) => row.peer);
}

type WritingReaderProps = {
  item: CatalogItem | null;
  onClose: () => void;
};

export function WritingReader({ item, onClose }: WritingReaderProps) {
  const { items: house } = useLiveCatalog();
  const { openReadable } = useReader();
  const [shareFlash, setShareFlash] = useState("");
  const paras = useMemo(
    () => (item ? paragraphs(item.body, item.blurb) : []),
    [item],
  );
  const related = useMemo(
    () => (item ? relatedFor(item, house) : []),
    [item, house],
  );
  const tsol = PLATFORMS.find((p) => p.id === "substack");

  useEffect(() => {
    if (!item) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);

  if (!item) return null;

  const share = async () => {
    setShareFlash("");
    const url = item.externalUrl?.startsWith("https://")
      ? item.externalUrl
      : `${SITE.url}/#browse`;
    const text = `${item.title} — ${item.brand || SITE.title}`;
    track("command", { cmd: "share_writing", id: item.id });
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: item.title, text, url });
        setShareFlash("shared");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareFlash("copied");
      } else {
        setShareFlash("—");
      }
    } catch {
      setShareFlash("—");
    }
    window.setTimeout(() => setShareFlash(""), 1400);
  };

  return (
    <div
      className="writing-reader"
      role="dialog"
      aria-modal="true"
      aria-labelledby="writing-reader-title"
    >
      <button
        type="button"
        className="writing-reader__scrim"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="writing-reader__card">
        <div className="writing-reader__chrome">
          <div className="writing-reader__mast">
            <span>house writing</span>
            <span>{kindLabel(item.kind)}</span>
            <span>{item.publishedAt}</span>
            {item.platform ? <span>{item.platform}</span> : null}
          </div>
          <div className="writing-reader__chrome-actions">
            <button type="button" className="writing-reader__share" onClick={() => void share()}>
              {shareFlash || "share"}
            </button>
            <button type="button" className="writing-reader__close" onClick={onClose}>
              close
            </button>
          </div>
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

          {related.length ? (
            <aside className="writing-reader__related" aria-label="Related writings">
              <p className="writing-reader__related-label">RELATED</p>
              <ul className="writing-reader__related-list">
                {related.map((peer) => (
                  <li key={peer.id}>
                    <button
                      type="button"
                      className="writing-reader__related-item"
                      onClick={() => openReadable(peer, house)}
                    >
                      <span className="writing-reader__related-brand">{peer.brand}</span>
                      <span className="writing-reader__related-title">{peer.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}

          {tsol ? (
            <p className="writing-reader__outlet">
              Essays also live on{" "}
              <a href={tsol.url} target="_blank" rel="noopener noreferrer">
                Telling Show Of Love
              </a>
              .
            </p>
          ) : null}
        </article>
      </div>
    </div>
  );
}
