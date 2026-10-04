"use client";

import { ALIASES, PLATFORMS, PRIMARY_NAME } from "@/data/identity";

export function AliasMatrix() {
  return (
    <section id="brands" className="section brands" aria-labelledby="brands-title">
      <header className="section__head">
        <div>
          <p className="section__eyebrow">identity://matrix</p>
          <h2 id="brands-title">NAMES · BRANDS · HANDLES</h2>
        </div>
        <p className="section__aside">
          {PRIMARY_NAME} — spelled as logged. Every alias routes into the same signal house.
        </p>
      </header>

      <ul className="alias-grid">
        {ALIASES.map((alias) => (
          <li key={alias.name} className="alias">
            <span className="alias__kind">{alias.kind}</span>
            <strong>{alias.name}</strong>
            {alias.short ? <span className="alias__short">{alias.short}</span> : null}
            {alias.note ? <span className="alias__note">{alias.note}</span> : null}
          </li>
        ))}
      </ul>

      <div className="uplinks">
        <h3>UPLINKS</h3>
        <ul>
          {PLATFORMS.map((platform) => (
            <li key={platform.id}>
              <a href={platform.url} target="_blank" rel="noopener noreferrer">
                <span>{platform.label}</span>
                <span>@{platform.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
