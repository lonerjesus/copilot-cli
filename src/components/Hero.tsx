"use client";

import { SITE, PRIMARY_NAME } from "@/data/identity";
import { usePlayer } from "@/components/player/PlayerContext";
import { getQueue } from "@/data/catalog";

export function Hero() {
  const { playItem, playing, current } = usePlayer();

  return (
    <section className="hero" aria-label="Hero">
      <div className="hero__atmosphere" aria-hidden>
        <div className="hero__grid" />
        <div className="hero__beam" />
        <div className="hero__noise" />
      </div>

      <div className="hero__content">
        <p className="hero__status">
          <span className="hero__live" />
          SYS.ONLINE · PORTFOLIO/VLOG STREAM
        </p>
        <h1 className="hero__brand">{SITE.title}</h1>
        <p className="hero__name">{PRIMARY_NAME}</p>
        <p className="hero__tag">{SITE.tagline}</p>
        <div className="hero__cta">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              const queue = getQueue();
              playItem(current ?? queue[0], queue);
            }}
          >
            {playing ? "resume deck" : "enter stream"}
          </button>
          <a className="btn btn--ghost" href="#footprint">
            watch footprint
          </a>
        </div>
      </div>
    </section>
  );
}
