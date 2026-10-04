"use client";

import { useEffect, useMemo, useState } from "react";
import { getMagazineByCatalogId } from "@/data/magazine";

function safeExternalHref(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    const ok =
      host === "www.magcloud.com" ||
      host === "magcloud.com" ||
      host === "tellingshowoflove.substack.com" ||
      host.endsWith(".bandcamp.com") ||
      host === "podcasts.apple.com";
    return ok ? url.toString() : null;
  } catch {
    return null;
  }
}

type MagazineReaderProps = {
  catalogId: string | null;
  onClose: () => void;
};

export function MagazineReader({ catalogId, onClose }: MagazineReaderProps) {
  const issue = useMemo(
    () => (catalogId ? getMagazineByCatalogId(catalogId) ?? null : null),
    [catalogId],
  );
  const [page, setPage] = useState(0);
  const pageSafe = issue ? Math.min(page, issue.spreads.length - 1) : 0;
  const spread = issue?.spreads[pageSafe];
  const sourceHref = issue ? safeExternalHref(issue.externalUrl) : null;

  useEffect(() => {
    if (!issue) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setPage((p) => Math.min(p + 1, issue.spreads.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setPage((p) => Math.max(p - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [issue, onClose]);

  if (!issue || !spread) return null;

  return (
    <div className="magazine" role="dialog" aria-modal="true" aria-label="Digital magazine">
      <div className="magazine__chrome">
        <div className="magazine__mast">
          <span>{issue.masthead}</span>
          <span>{issue.issueLabel}</span>
          <span>
            {pageSafe + 1}/{issue.spreads.length}
          </span>
        </div>
        <div className="magazine__actions">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={pageSafe === 0}
          >
            ← prev
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, issue.spreads.length - 1))}
            disabled={pageSafe >= issue.spreads.length - 1}
          >
            next →
          </button>
          {sourceHref ? (
            <a href={sourceHref} target="_blank" rel="noopener noreferrer">
              source ↗
            </a>
          ) : null}
          <button type="button" className="magazine__close" onClick={onClose}>
            close ✕
          </button>
        </div>
      </div>

      <article
        key={issue.id}
        className={`magazine__spread magazine__spread--${issue.mode}`}
      >
        <header className="magazine__head">
          <p className="magazine__kicker">{spread.kicker}</p>
          <h2>{spread.headline}</h2>
          {spread.dek ? <p className="magazine__dek">{spread.dek}</p> : null}
        </header>

        <div className="magazine__columns">
          {spread.body.map((para) => (
            <p key={para.slice(0, 48)}>{para}</p>
          ))}
        </div>

        {spread.pullQuote ? (
          <blockquote className="magazine__pull">
            <p>{spread.pullQuote}</p>
          </blockquote>
        ) : null}

        <footer className="magazine__folio">
          <span>{issue.brand}</span>
          <span>{spread.folio}</span>
        </footer>
      </article>

      <div className="magazine__dots" aria-hidden>
        {issue.spreads.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={i === pageSafe ? "is-on" : ""}
            onClick={() => setPage(i)}
          />
        ))}
      </div>
    </div>
  );
}
