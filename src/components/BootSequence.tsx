"use client";

import { useCallback, useEffect, useState } from "react";
import { SITE } from "@/data/identity";
import { track } from "@/lib/analytics";

const LINES = [
  "> boot",
  "> stream online",
];

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(0);
  const [fade, setFade] = useState(false);

  const finish = useCallback(
    (via: "auto" | "skip") => {
      track("boot_complete", { via });
      onDone();
    },
    [onDone],
  );

  useEffect(() => {
    const timers: number[] = [];
    LINES.forEach((_, i) => {
      timers.push(window.setTimeout(() => setVisible(i + 1), 120 + i * 140));
    });
    timers.push(
      window.setTimeout(() => {
        setFade(true);
        window.setTimeout(() => finish("auto"), 280);
      }, 120 + LINES.length * 140 + 220),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [finish]);

  return (
    <div className={`boot ${fade ? "boot--out" : ""}`} role="dialog" aria-label="System boot">
      <button type="button" className="boot__skip" onClick={() => finish("skip")}>
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
