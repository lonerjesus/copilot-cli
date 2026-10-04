"use client";

import { useEffect, useMemo, useState } from "react";
import type { CatalogItem } from "@/data/catalog";

function youtubeThumb(item: CatalogItem): string | null {
  const id =
    item.embed?.provider === "youtube"
      ? item.embed.id
      : (() => {
          try {
            const u = new URL(item.externalUrl);
            if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
            if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
          } catch {
            return null;
          }
          return null;
        })();
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

function seedPoster(item: CatalogItem): string | null {
  return item.poster || youtubeThumb(item) || null;
}

/** Seamless original platform artwork for fetched/scraped media. */
export function MediaPoster({
  item,
  className = "",
  label,
}: {
  item: CatalogItem;
  className?: string;
  label?: string;
}) {
  const seed = useMemo(() => seedPoster(item), [item]);
  const [remote, setRemote] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const src = seed || remote;

  useEffect(() => {
    if (seed || !item.externalUrl.startsWith("https://")) return;
    let alive = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/oembed?url=${encodeURIComponent(item.externalUrl)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { thumbnail_url?: string };
        if (alive && data.thumbnail_url?.startsWith("https://")) {
          setRemote(data.thumbnail_url);
        }
      } catch {
        /* glyph fallback */
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [seed, item.externalUrl]);

  if (!src || failed) {
    return (
      <div className={`media-poster media-poster--empty ${className}`} aria-hidden>
        {label ? <span className="media-poster__label">{label}</span> : null}
      </div>
    );
  }

  return (
    <div className={`media-poster ${loaded ? "is-ready" : ""} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote platform thumbs; hosts vary */}
      <img
        key={src}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
      {label ? <span className="media-poster__label">{label}</span> : null}
    </div>
  );
}
