"use client";

import Link from "next/link";
import { SITE } from "@/data/identity";
import { usePlayerState } from "@/components/player/PlayerContext";
import { useMagazine } from "@/components/MagazineContext";
import { BrandMark } from "@/components/BrandMark";
import { getQueue, isPlayableMedia } from "@/data/catalog";
import { track } from "@/lib/analytics";

export function Hero() {
  const { playItem, playing, current } = usePlayerState();
  const { openMagazine, hasMagazine } = useMagazine();

  return (
    <section className="hero hero--compact" aria-label="Hero">
      <div className="hero__atmosphere" aria-hidden>
        <div className="hero__grid" />
        <div className="hero__noise" />
      </div>

      <div className="hero__content">
        <div className="hero__logo-wrap">
          <BrandMark size={148} priority className="hero__logo" />
          <h1 className="hero__brand sr-only">{SITE.title}</h1>
        </div>
        <p className="hero__tagline">{SITE.tagline}</p>
        <p className="hero__commerce">
          Member house stream · outside archive on Footprint
        </p>
        <div className="hero__cta">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              const queue = getQueue();
              const item =
                (current && isPlayableMedia(current) ? current : null) ?? queue[0];
              track("enter_stream", { id: item?.id ?? "empty" });
              if (!item) return;
              if (!isPlayableMedia(item)) {
                if (hasMagazine(item.id)) openMagazine(item.id);
                return;
              }
              playItem(item, queue);
            }}
          >
            {playing ? "▶" : "stream"}
          </button>
          <Link className="btn btn--ghost" href="/footprint" aria-label="Footprint archive">
            E:
          </Link>
        </div>
      </div>
    </section>
  );
}
