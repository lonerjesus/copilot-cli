"use client";

import { SITE } from "@/data/identity";
import { BrandMark } from "@/components/BrandMark";

export function Hero({ onStream }: { onStream?: () => void }) {
  return (
    <section className="hero hero--minimal" aria-label={SITE.title}>
      <div className="hero__atmosphere" aria-hidden>
        <div className="hero__grid" />
        <div className="hero__noise" />
      </div>
      <div className="hero__content">
        <BrandMark size={120} priority className="hero__logo hero__logo--pulse" />
        <h1 className="sr-only">{SITE.title}</h1>
        <button
          type="button"
          className="btn btn--primary hero__play"
          onClick={onStream}
          aria-label="Play stream"
        >
          ▶
        </button>
      </div>
    </section>
  );
}
