"use client";

import { useEffect, useRef } from "react";
import { BIRTH, COSMOGRAM } from "@/data/cosmogram";
import { track } from "@/lib/analytics";

export function CosmogramPanel() {
  const seen = useRef(false);

  useEffect(() => {
    const node = document.getElementById("cosmogram");
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !seen.current) {
          seen.current = true;
          track("cosmogram_view");
        }
      },
      { threshold: 0.35 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section id="cosmogram" className="section cosmogram" aria-labelledby="cosmo-title">
      <header className="section__head">
        <div>
          <p className="section__eyebrow">chart://cosmogram</p>
          <h2 id="cosmo-title">{COSMOGRAM.title}</h2>
        </div>
        <p className="section__aside">{COSMOGRAM.blurb}</p>
      </header>

      <div className="cosmo-hero">
        <div>
          <p className="cosmo-hero__name">{BIRTH.name}</p>
          <p className="cosmo-hero__aka">
            {BIRTH.alsoKnownAs.map((n) => n).join(" · ")}
          </p>
          <p className="cosmo-hero__dob">DOB {BIRTH.dob}</p>
        </div>
        <div className="cosmo-hero__glyphs" aria-label="Core numbers">
          <div>
            <span>SUN</span>
            <strong>{BIRTH.sunSign}</strong>
          </div>
          <div>
            <span>LIFE PATH</span>
            <strong>{BIRTH.lifePath}</strong>
          </div>
          <div>
            <span>BIRTHDAY</span>
            <strong>{BIRTH.birthdayNumber}</strong>
          </div>
        </div>
      </div>

      <ul className="cosmo-pillars">
        {COSMOGRAM.pillars.map((pillar) => (
          <li key={pillar.label}>
            <strong>{pillar.label}</strong>
            <p>{pillar.line}</p>
          </li>
        ))}
      </ul>

      <div className="cosmo-grid">
        <div>
          <h3>AFFIRMATIONS · PRO-BLACK LIGHT</h3>
          <ul className="cosmo-affirms">
            {COSMOGRAM.affirmations.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>TECH · CULTURE · HOUSE</h3>
          <ul className="cosmo-tech">
            {COSMOGRAM.techPop.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="cosmo-tags">
        {COSMOGRAM.vibeTags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </section>
  );
}
