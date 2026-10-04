"use client";

import { useCallback, useState } from "react";
import { AgeGate } from "@/components/AgeGate";
import { BootSequence } from "@/components/BootSequence";
import { CommandBar } from "@/components/CommandBar";
import { Hero } from "@/components/Hero";
import { StreamDeck } from "@/components/StreamDeck";
import { FootprintFeed } from "@/components/FootprintFeed";
import { AliasMatrix } from "@/components/AliasMatrix";
import { PlayerDock } from "@/components/player/PlayerDock";
import { PlayerProvider, usePlayer } from "@/components/player/PlayerContext";
import type { FootprintItem } from "@/lib/feed";
import { SITE } from "@/data/identity";

function ShellInner({ footprint }: { footprint: FootprintItem[] }) {
  const [booted, setBooted] = useState(false);
  const { toggle, setExpanded } = usePlayer();

  const onCommand = useCallback(
    (cmd: string) => {
      if (cmd === "help") {
        document.getElementById("commands")?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (cmd === "play") {
        setExpanded(true);
        toggle();
        return;
      }
      const map: Record<string, string> = {
        stream: "stream",
        footprint: "footprint",
        brands: "brands",
      };
      const id = map[cmd];
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    },
    [setExpanded, toggle],
  );

  return (
    <>
      <AgeGate />
      {!booted ? <BootSequence onDone={() => setBooted(true)} /> : null}
      <div className={`shell ${booted ? "shell--ready" : "shell--booting"}`}>
        <p className="agebanner" role="note">
          18+ · not for people under 18 · mature content may appear
        </p>
        <header className="topbar">
          <a className="topbar__brand" href="#top">
            <span className="topbar__mark">KN</span>
            <span>
              <strong>{SITE.title}</strong>
              <small>{SITE.domain}</small>
            </span>
          </a>
          <nav className="topbar__nav" aria-label="Primary">
            <a href="#stream">stream</a>
            <a href="#footprint">footprint</a>
            <a href="#brands">brands</a>
          </nav>
        </header>

        <main id="top">
          <Hero />
          <div id="commands" className="cmd-wrap">
            <CommandBar onCommand={onCommand} />
          </div>
          <StreamDeck />
          <FootprintFeed initial={footprint} />
          <AliasMatrix />
        </main>

        <footer className="footer">
          <p>
            © {new Date().getFullYear()} Kendrick-Kamau Negasi LLC · BLKDTY Music LLC · All
            rights reserved.
          </p>
          <p className="footer__note">
            Warning: 18+ only. This platform is not for people under 18 due to certain content.
          </p>
          <p className="footer__note">
            Creating is the Ritual, Love is the Reason. · Cloudflare edge ready.
          </p>
        </footer>

        <PlayerDock />
      </div>
    </>
  );
}

export function AppShell({ footprint }: { footprint: FootprintItem[] }) {
  return (
    <PlayerProvider>
      <ShellInner footprint={footprint} />
    </PlayerProvider>
  );
}
