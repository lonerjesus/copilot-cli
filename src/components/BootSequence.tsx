"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/data/identity";

const LINES = [
  "> boot kamaunegasi.net",
  "> mount brands: Streetpolitik · GAK · TSOL · BLKDTY · TL1",
  "> uplink social footprint … ok",
  "> load custom media deck … ok",
  "> enter stream mode",
];

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    LINES.forEach((_, i) => {
      timers.push(window.setTimeout(() => setVisible(i + 1), 280 + i * 320));
    });
    timers.push(
      window.setTimeout(() => {
        setFade(true);
        window.setTimeout(onDone, 480);
      }, 280 + LINES.length * 320 + 420),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [onDone]);

  return (
    <div className={`boot ${fade ? "boot--out" : ""}`} role="dialog" aria-label="System boot">
      <button type="button" className="boot__skip" onClick={onDone}>
        skip_
      </button>
      <div className="boot__panel">
        <p className="boot__brand">{SITE.title}</p>
        <p className="boot__domain">{SITE.domain}</p>
        <ul className="boot__log">
          {LINES.slice(0, visible).map((line) => (
            <li key={line}>{line}</li>
          ))}
          <li className="boot__cursor" aria-hidden>
            <span />
          </li>
        </ul>
      </div>
    </div>
  );
}
