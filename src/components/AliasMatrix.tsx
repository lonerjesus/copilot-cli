"use client";

import { useMemo } from "react";
import { ALIASES, PLATFORMS } from "@/data/identity";

const KIND_ORDER = ["entity", "artist", "brand", "project", "handle"] as const;

export function AliasMatrix({ compact = false }: { compact?: boolean }) {
  const groups = useMemo(() => {
    return KIND_ORDER.map((kind) => ({
      kind,
      items: ALIASES.filter((alias) => alias.kind === kind),
    })).filter((group) => group.items.length > 0);
  }, []);

  return (
    <section
      className={`section brands ${compact ? "section--compact" : ""}`}
      aria-label="Names"
    >
      {!compact ? (
        <header className="section__head">
          <div>
            <h2 id="brands-title">NAMES</h2>
          </div>
        </header>
      ) : null}

      <div className="alias-groups">
        {groups.map((group) => (
          <div key={group.kind} className="alias-group">
            <h3 className="alias-group__title">{group.kind}</h3>
            <ul className="alias-grid">
              {group.items.map((alias) => (
                <li key={alias.name} className="alias">
                  <strong>{alias.name}</strong>
                  {alias.short ? <span className="alias__short">{alias.short}</span> : null}
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
