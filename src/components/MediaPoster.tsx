"use client";

import { useEffect, useMemo, useState } from "react";
import type { CatalogItem } from "@/data/catalog";
import { HouseMediaImage, useHouseMediaSrc } from "@/components/HouseMediaImage";
import { isHouseMediaUrl } from "@/lib/media-store";

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

function FallbackMark({
  item,
  className,
  label,
}: {
  item: CatalogItem;
  className: string;
  label?: string;
}) {
  const mark = (item.title || item.brand || "?").trim().slice(0, 1).toUpperCase() || "·";
  return (
    <div className={`media-poster media-poster--empty ${className}`} aria-hidden>
      <span className="media-poster__fallback">{mark}</span>
      {label ? <span className="media-poster__label">{label}</span> : null}
    </div>
  );
}

/** Seamless house / platform artwork with credentialed private media load. */
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
  const [publicFailed, setPublicFailed] = useState(false);
  const [publicLoaded, setPublicLoaded] = useState(false);

  const activeSeed = seed && brokenSeed === seed ? null : seed;
  const remoteThumb = remote?.forUrl === item.externalUrl ? remote.thumb : null;
  const src = activeSeed || remoteThumb;
  const house = Boolean(src && isHouseMediaUrl(src));
  const houseMedia = useHouseMediaSrc(house ? src : null);

  useEffect(() => {
    setBrokenSeed(null);
    setPublicFailed(false);
    setPublicLoaded(false);
  }, [item.id, item.poster, item.externalUrl]);

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

  useEffect(() => {
    if (house && houseMedia.failed && activeSeed && src === activeSeed) {
      setBrokenSeed(activeSeed);
    }
  }, [house, houseMedia.failed, activeSeed, src]);

  if (!src || (house && houseMedia.failed) || (!house && publicFailed)) {
    return <FallbackMark item={item} className={className} label={label} />;
  }

  if (house) {
    const ready = Boolean(houseMedia.displaySrc);
    return (
      <div className={`media-poster ${ready ? "is-ready" : ""} ${className}`}>
        {houseMedia.displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL from credentialed fetch
          <img src={houseMedia.displaySrc} alt="" loading="lazy" decoding="async" />
        ) : null}
        {label ? <span className="media-poster__label">{label}</span> : null}
      </div>
    );
  }

  return (
    <div className={`media-poster ${publicLoaded ? "is-ready" : ""} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote platform thumbs; hosts vary */}
      <img
        key={src}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setPublicLoaded(true)}
        onError={() => {
          if (activeSeed && src === activeSeed) {
            setBrokenSeed(activeSeed);
            return;
          }
          setPublicFailed(true);
        }}
      />
      {label ? <span className="media-poster__label">{label}</span> : null}
    </div>
  );
}

/** Admin compose thumbnail preview — same credentialed path as the stream. */
export function AdminThumbPreview({ src, className }: { src: string; className?: string }) {
  return <HouseMediaImage src={src} className={className} alt="" />;
}
