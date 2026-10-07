"use client";

import { useEffect, useState } from "react";

/** Admin-controlled marquee under the 18+ banner. */
export function SiteTicker() {
  const [text, setText] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch("/api/ticker", {
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { text?: string; enabled?: boolean };
        if (data.enabled && data.text?.trim()) setText(data.text.trim());
        else setText("");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    };
    void load();
    const id = window.setInterval(load, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(id);
    };
  }, []);

  if (!text) return null;

  const loop = `${text}   ·   ${text}   ·   ${text}   ·   `;

  return (
    <div className="site-ticker" role="marquee" aria-label="Site notice">
      <div className="site-ticker__track">
        <span>{loop}</span>
        <span aria-hidden>{loop}</span>
      </div>
    </div>
  );
}
