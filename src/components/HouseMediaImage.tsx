"use client";

import { useEffect, useState } from "react";
import { isHouseMediaUrl } from "@/lib/media-store";

/**
 * Load private `/api/media/house/…` binaries with an explicit credentialed
 * fetch, then paint via blob URL. Bare `<img src>` is unreliable for
 * session-gated Workers media (Lockdown / cookie edge cases).
 */
export function useHouseMediaSrc(src: string | undefined | null): {
  displaySrc: string | null;
  failed: boolean;
  loading: boolean;
} {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(src));

  useEffect(() => {
    if (!src) {
      setDisplaySrc(null);
      setFailed(false);
      setLoading(false);
      return;
    }

    let alive = true;
    let objectUrl: string | null = null;

    if (!isHouseMediaUrl(src)) {
      setDisplaySrc(src);
      setFailed(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFailed(false);
    setDisplaySrc(null);

    const run = async () => {
      try {
        const res = await fetch(src, {
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "image/*,*/*" },
        });
        if (!res.ok) throw new Error(`media_${res.status}`);
        const blob = await res.blob();
        if (!blob.size) throw new Error("empty_media");
        objectUrl = URL.createObjectURL(blob);
        if (!alive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setDisplaySrc(objectUrl);
        setFailed(false);
      } catch {
        if (alive) {
          setDisplaySrc(null);
          setFailed(true);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    void run();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return { displaySrc, failed, loading };
}

export function HouseMediaImage({
  src,
  alt = "",
  className,
  onReady,
  onFailed,
}: {
  src: string;
  alt?: string;
  className?: string;
  onReady?: () => void;
  onFailed?: () => void;
}) {
  const { displaySrc, failed, loading } = useHouseMediaSrc(src);

  useEffect(() => {
    if (failed) onFailed?.();
  }, [failed, onFailed]);

  useEffect(() => {
    if (displaySrc && !loading) onReady?.();
  }, [displaySrc, loading, onReady]);

  if (!displaySrc) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob / remote thumbs
    <img
      className={className}
      src={displaySrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => onReady?.()}
      onError={() => onFailed?.()}
    />
  );
}
