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
  const [brokenSeed, setBrokenSeed] = useState<string | null>(null);
  const [remote, setRemote] = useState<{ forUrl: string; thumb: string } | null>(null);
  const [status, setStatus] = useState<{ src: string; loaded?: boolean; failed?: boolean }>({
    src: "",
  });

  const activeSeed = seed && brokenSeed === seed ? null : seed;
  const remoteThumb = remote?.forUrl === item.externalUrl ? remote.thumb : null;
  const src = activeSeed || remoteThumb;
  const loaded = Boolean(src && status.src === src && status.loaded);
  const failed = Boolean(src && status.src === src && status.failed);

  useEffect(() => {
    if (activeSeed || !item.externalUrl.startsWith("https://")) return;
    let alive = true;
    const forUrl = item.externalUrl;
    const run = async () => {
      try {
        const res = await fetch(`/api/oembed?url=${encodeURIComponent(forUrl)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { thumbnail_url?: string };
        const thumb = data.thumbnail_url;
        if (alive && thumb && (thumb.startsWith("https://") || thumb.startsWith("/"))) {
          setRemote({ forUrl, thumb });
        }
      } catch {
        /* glyph fallback */
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [activeSeed, item.externalUrl]);

  if (!src || failed) {
    const mark = (item.brand || item.title || "?").trim().slice(0, 1).toUpperCase() || "·";
    return (
      <div className={`media-poster media-poster--empty ${className}`} aria-hidden>
        <span className="media-poster__fallback">{mark}</span>
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
        onLoad={() => setStatus({ src, loaded: true })}
        onError={() => {
          if (activeSeed && src === activeSeed) {
            setBrokenSeed(activeSeed);
            return;
          }
          setStatus({ src, failed: true });
        }}
      />
      {label ? <span className="media-poster__label">{label}</span> : null}
    </div>
  );
}
