"use client";

import { useCallback, useEffect, useState } from "react";
import { AgeGate } from "@/components/AgeGate";
import { BootSequence } from "@/components/BootSequence";
import { CommandBar } from "@/components/CommandBar";
import { Hero } from "@/components/Hero";
import { StreamDeck } from "@/components/StreamDeck";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { ContinuumRail } from "@/components/ContinuumRail";
import { FootprintFeed } from "@/components/FootprintFeed";
import { AliasMatrix } from "@/components/AliasMatrix";
import { CosmogramPanel } from "@/components/Cosmogram";
import { MagazineReader } from "@/components/MagazineReader";
import { MagazineProvider, useMagazine } from "@/components/MagazineContext";
import { PlayerDock } from "@/components/player/PlayerDock";
import { PlayerProvider, usePlayerState } from "@/components/player/PlayerContext";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { DonatePanel } from "@/components/DonatePanel";
import { SaveGuard } from "@/components/SaveGuard";
import type { FootprintItem } from "@/lib/feed";
import { BIRTH_NAME, SITE } from "@/data/identity";
import { findCategoryByQuery, type CategoryId, type SubcategoryId } from "@/data/taxonomy";

function ShellInner({ footprint }: { footprint: FootprintItem[] }) {
  const [booted, setBooted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<CategoryId | "all">("all");
  const [searchSubcategory, setSearchSubcategory] = useState<SubcategoryId | "all">("all");
  const [browseKey, setBrowseKey] = useState(0);
  const { toggle, setExpanded } = usePlayerState();
  const { openId, closeMagazine } = useMagazine();
  const { user, logout, refresh } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Ownership comes from the server after webhook/demo settle — refresh only.
    if (params.get("purchased") || params.get("donated") === "1") {
      void refresh();
    }
  }, [refresh]);

  const applySearch = useCallback((query: string) => {
    const hit = findCategoryByQuery(query);
    setSearchQuery(query);
    setSearchCategory(hit.category?.id ?? "all");
    setSearchSubcategory(hit.subcategory?.id ?? "all");
    setBrowseKey((k) => k + 1);
  }, []);

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
        categories: "categories",
        magazine: "stream",
        cosmogram: "cosmogram",
        footprint: "footprint",
        brands: "brands",
        support: "support",
        donate: "support",
      };
      const id = map[cmd];
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    },
    [setExpanded, toggle],
  );

  return (
    <>
      <a className="skip-link" href="#top">
        Skip to content
      </a>
      <AgeGate />
      <SaveGuard />
      {!booted ? <BootSequence onDone={() => setBooted(true)} /> : null}
      <div className="shell shell--ready">
        <p className="agebanner" role="note">
          18+ · not for people under 18 · mature content may appear · pro-Black excellence only
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
            <a href="#categories">categories</a>
            <a href="#cosmogram">cosmogram</a>
            <a href="#footprint">footprint</a>
            <a href="#support">support</a>
            <a href="#brands">brands</a>
          </nav>
          <div className="topbar__account">
            <span className="topbar__user" title={user?.email}>
              {user?.displayName ?? "member"}
            </span>
            <button type="button" className="topbar__logout" onClick={() => void logout()}>
              sign out
            </button>
          </div>
        </header>

        <main id="top" tabIndex={-1}>
          <Hero />
          <ContinuumRail />
          <div id="commands" className="cmd-wrap">
            <CommandBar onCommand={onCommand} onSearch={applySearch} />
          </div>
          <StreamDeck />
          <CategoryBrowser
            key={browseKey}
            initialQuery={searchQuery}
            initialCategory={searchCategory}
            initialSubcategory={searchSubcategory}
          />
          <CosmogramPanel />
          <FootprintFeed initial={footprint} />
          <DonatePanel />
          <AliasMatrix />
        </main>

        <footer className="footer">
          <p>
            © {new Date().getFullYear()} {BIRTH_NAME} · Kendrick-Kamau Negasi LLC · BLKDTY Music
            LLC · All rights reserved.
          </p>
          <p className="footer__note">
            Warning: 18+ only. Account required. Automated scraping and bulk fetch are blocked.
            Downloads/saves require a paid license per piece.
          </p>
          <p className="footer__note">
            Creating is the Ritual, Love is the Reason. · #BeAutonomous · Cloudflare edge ready.
          </p>
        </footer>

        <PlayerDock />
        <MagazineReader catalogId={openId} onClose={closeMagazine} />
      </div>
    </>
  );
}

export function AppShell({ footprint }: { footprint: FootprintItem[] }) {
  return (
    <AuthProvider>
      <PlayerProvider>
        <MagazineProvider>
          <ShellInner footprint={footprint} />
        </MagazineProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
