"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import type { CatalogItem } from "@/data/catalog";
import { photoSrc } from "@/data/catalog";
import { useHouseMediaSrc } from "@/components/HouseMediaImage";
import { ContentPayActions } from "@/components/ContentPayActions";

type PhotoGalleryProps = {
  items: CatalogItem[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function GallerySlide({
  item,
  active,
  zoom,
  offsetX,
  offsetY,
  onDoubleTap,
}: {
  item: CatalogItem;
  active: boolean;
  zoom: number;
  offsetX: number;
  offsetY: number;
  onDoubleTap: (clientX: number, clientY: number) => void;
}) {
  const src = photoSrc(item);
  const media = useHouseMediaSrc(src);
  const lastTap = useRef(0);

  if (!active) return <div className="photo-gallery__slide" aria-hidden />;

  return (
    <div className="photo-gallery__slide">
      {media.displaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- credentialed blob / remote still
        <img
          className="photo-gallery__img"
          src={media.displaySrc}
          alt={item.title}
          draggable={false}
          style={{
            transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${zoom})`,
          }}
          onClick={(e) => {
            const now = Date.now();
            if (now - lastTap.current < 280) {
              onDoubleTap(e.clientX, e.clientY);
              lastTap.current = 0;
            } else {
              lastTap.current = now;
            }
          }}
        />
      ) : (
        <div className="photo-gallery__loading" aria-live="polite">
          {media.failed ? "image unavailable" : "loading…"}
        </div>
      )}
    </div>
  );
}

export function PhotoGallery({ items, index, onIndexChange, onClose }: PhotoGalleryProps) {
  const safeItems = items.length ? items : [];
  const i = clamp(index, 0, Math.max(0, safeItems.length - 1));
  const current = safeItems[i] ?? null;
  const [chrome, setChrome] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    mode: "swipe" | "pan" | "pinch" | null;
    x0: number;
    y0: number;
    pan0x: number;
    pan0y: number;
    dx: number;
    dy: number;
    pinch0?: number;
    zoom0?: number;
  }>({ mode: null, x0: 0, y0: 0, pan0x: 0, pan0y: 0, dx: 0, dy: 0 });
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragX(0);
    setDragY(0);
  }, []);

  useEffect(() => {
    resetView();
  }, [i, resetView]);

  useEffect(() => {
    if (!current) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && i < safeItems.length - 1) onIndexChange(i + 1);
      if (event.key === "ArrowLeft" && i > 0) onIndexChange(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [current, i, onClose, onIndexChange, safeItems.length]);

  const go = useCallback(
    (dir: -1 | 1) => {
      const next = i + dir;
      if (next < 0 || next >= safeItems.length) return;
      onIndexChange(next);
    },
    [i, onIndexChange, safeItems.length],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      mode: zoom > 1.01 ? "pan" : "swipe",
      x0: event.clientX,
      y0: event.clientY,
      pan0x: pan.x,
      pan0y: pan.y,
      dx: 0,
      dy: 0,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.mode || d.mode === "pinch") return;
    d.dx = event.clientX - d.x0;
    d.dy = event.clientY - d.y0;
    if (d.mode === "pan") {
      setPan({ x: d.pan0x + d.dx, y: d.pan0y + d.dy });
      return;
    }
    // Prefer vertical dismiss once clearly downward; else horizontal swipe
    if (Math.abs(d.dy) > Math.abs(d.dx) && d.dy > 12) {
      setDragY(d.dy);
      setDragX(0);
    } else {
      setDragX(d.dx);
      setDragY(0);
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d.mode || d.mode === "pinch") {
      drag.current.mode = null;
      return;
    }
    if (d.mode === "pan") {
      drag.current.mode = null;
      return;
    }
    const absX = Math.abs(d.dx);
    const absY = Math.abs(d.dy);
    if (absY > 90 && absY > absX) {
      onClose();
    } else if (absX > 70 && absX > absY) {
      if (d.dx < 0) go(1);
      else go(-1);
    } else if (absX < 8 && absY < 8) {
      setChrome((c) => !c);
    }
    setDragX(0);
    setDragY(0);
    drag.current.mode = null;
  };

  const onTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      const a = event.touches[0]!;
      const b = event.touches[1]!;
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      drag.current = {
        mode: "pinch",
        x0: 0,
        y0: 0,
        pan0x: pan.x,
        pan0y: pan.y,
        dx: 0,
        dy: 0,
        pinch0: dist,
        zoom0: zoom,
      };
    }
  };

  const onTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (drag.current.mode !== "pinch" || event.touches.length !== 2) return;
    const a = event.touches[0]!;
    const b = event.touches[1]!;
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const z0 = drag.current.zoom0 ?? 1;
    const p0 = drag.current.pinch0 ?? dist;
    setZoom(clamp((z0 * dist) / p0, 1, 4));
  };

  const onDoubleTap = () => {
    if (zoom > 1.01) {
      resetView();
    } else {
      setZoom(2.4);
    }
  };

  if (!current) return null;

  const dismissProgress = clamp(dragY / 280, 0, 1);
  const stageOpacity = 1 - dismissProgress * 0.55;

  return (
    <div
      className={`photo-gallery ${chrome ? "photo-gallery--chrome" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      style={{ opacity: stageOpacity }}
    >
      <div className="photo-gallery__backdrop" style={{ opacity: 1 - dismissProgress * 0.4 }} />

      <header className="photo-gallery__top">
        <button type="button" className="photo-gallery__close" onClick={onClose}>
          ✕
        </button>
        <div className="photo-gallery__meta">
          <p className="photo-gallery__count">
            {i + 1} / {safeItems.length}
          </p>
          <h2 className="photo-gallery__title">{current.title}</h2>
        </div>
        <span className="photo-gallery__spacer" />
      </header>

      <div
        className="photo-gallery__stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        style={{ transform: `translate3d(${dragX}px, ${dragY}px, 0)` }}
      >
        <GallerySlide
          item={current}
          active
          zoom={zoom}
          offsetX={pan.x}
          offsetY={pan.y}
          onDoubleTap={onDoubleTap}
        />
      </div>

      <footer className="photo-gallery__foot">
        {current.blurb || current.body ? (
          <p className="photo-gallery__caption">
            {(current.blurb || current.body || "").trim().slice(0, 220)}
          </p>
        ) : null}
        <div className="photo-gallery__pay">
          <ContentPayActions catalogId={current.id} title={current.title} />
        </div>
        {safeItems.length > 1 ? (
          <div className="photo-gallery__strip" aria-label="Photos">
            {safeItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`photo-gallery__thumb ${idx === i ? "is-on" : ""}`}
                onClick={() => onIndexChange(idx)}
                aria-label={`${item.title} (${idx + 1})`}
                aria-current={idx === i ? "true" : undefined}
              >
                <span>{idx + 1}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="photo-gallery__nav">
          <button type="button" disabled={i <= 0} onClick={() => go(-1)} aria-label="Previous photo">
            ←
          </button>
          <button
            type="button"
            disabled={i >= safeItems.length - 1}
            onClick={() => go(1)}
            aria-label="Next photo"
          >
            →
          </button>
        </div>
      </footer>
    </div>
  );
}
