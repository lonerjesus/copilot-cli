"use client";

import { useMemo } from "react";
import { ALIASES, PLATFORMS, PRIMARY_NAME } from "@/data/identity";

const KIND_ORDER = ["entity", "artist", "brand", "project", "handle"] as const;

export function AliasMatrix() {
  const groups = useMemo(() => {
    return KIND_ORDER.map((kind) => ({
      kind,
      items: ALIASES.filter((alias) => alias.kind === kind),
    })).filter((group) => group.items.length > 0);
  }, []);

  return (
    <section id="brands" className="section brands" aria-labelledby="brands-title">
      <header className="section__head">
        <div>
          <p className="section__eyebrow">identity://matrix</p>
          <h2 id="brands-title">NAMES · BRANDS · HANDLES</h2>
        </div>
        <p className="section__aside">
          {PRIMARY_NAME} — spelled as logged. Separated by identity class.
        </p>
      </header>

      <div className="alias-groups">
        {groups.map((group) => (
          <div key={group.kind} className="alias-group">
            <h3 className="alias-group__title">{group.kind}</h3>
            <ul className="alias-grid">
              {group.items.map((alias) => (
                <li key={alias.name} className="alias">
                  <span className="alias__kind">{alias.kind}</span>
                  <strong>{alias.name}</strong>
                  {alias.short ? <span className="alias__short">{alias.short}</span> : null}
                  {alias.note ? <span className="alias__note">{alias.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

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
