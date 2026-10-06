"use client";

import Link from "next/link";
import { SITE } from "@/data/identity";
import { usePlayerState } from "@/components/player/PlayerContext";
import { getQueue } from "@/data/catalog";
import { track } from "@/lib/analytics";

export function Hero() {
  const { playItem, playing, current } = usePlayerState();

  return (
    <section className="hero hero--compact" aria-label="Hero">
      <div className="hero__atmosphere" aria-hidden>
        <div className="hero__grid" />
        <div className="hero__noise" />
      </div>

      <div className="hero__content">
        <h1 className="hero__brand">{SITE.title}</h1>
        <div className="hero__cta">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              const queue = getQueue();
              const item = current ?? queue[0];
              track("enter_stream", { id: item?.id ?? "empty" });
              playItem(item, queue);
            }}
          >
            {playing ? "▶" : "stream"}
          </button>
          <Link className="btn btn--ghost" href="/footprint">
            F:
          </Link>
        </div>
      </div>
    </section>
  );
}
