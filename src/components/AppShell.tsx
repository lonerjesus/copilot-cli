"use client";

import { useCallback, useEffect, useState } from "react";
import { AgeGate } from "@/components/AgeGate";
import { BootSequence } from "@/components/BootSequence";
import { CommandBar } from "@/components/CommandBar";
import { Hero } from "@/components/Hero";
import { StreamDeck } from "@/components/StreamDeck";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { AliasMatrix } from "@/components/AliasMatrix";
import { CosmogramPanel } from "@/components/Cosmogram";
import { DriveBay } from "@/components/DriveBay";
import { MagazineReader } from "@/components/MagazineReader";
import { MagazineProvider, useMagazine } from "@/components/MagazineContext";
import { PlayerDock } from "@/components/player/PlayerDock";
import { PlayerProvider, usePlayerState } from "@/components/player/PlayerContext";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { DonatePanel } from "@/components/DonatePanel";
import { PRIMARY_NAME, SITE } from "@/data/identity";
import { findCategoryByQuery, type CategoryId, type SubcategoryId } from "@/data/taxonomy";

type BayId = "stream" | "browse" | "chart" | "names" | "support";

function ShellInner() {
  const [booted, setBooted] = useState(false);
  const [openBay, setOpenBay] = useState<BayId | null>("stream");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<CategoryId | "all">("all");
  const [searchSubcategory, setSearchSubcategory] = useState<SubcategoryId | "all">("all");
  const [browseKey, setBrowseKey] = useState(0);
  const { toggle, setExpanded } = usePlayerState();
  const { openId, closeMagazine } = useMagazine();
  const { user, logout, refresh } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchased") || params.get("donated") === "1") {
      void refresh();
    }
  }, [refresh]);

  const toggleBay = useCallback((id: BayId) => {
    setOpenBay((cur) => (cur === id ? null : id));
  }, []);

  const openBayTo = useCallback((id: BayId) => {
    setOpenBay(id);
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const applySearch = useCallback(
    (query: string) => {
      const hit = findCategoryByQuery(query);
      setSearchQuery(query);
      setSearchCategory(hit.category?.id ?? "all");
      setSearchSubcategory(hit.subcategory?.id ?? "all");
      setBrowseKey((k) => k + 1);
      openBayTo("browse");
    },
    [openBayTo],
  );

  const onCommand = useCallback(
    (cmd: string) => {
      if (cmd === "play") {
        setExpanded(true);
        toggle();
        return;
      }
      if (cmd === "footprint") {
        window.location.href = "/footprint";
        return;
      }
      const map: Record<string, BayId> = {
        stream: "stream",
        categories: "browse",
        magazine: "stream",
        cosmogram: "chart",
        brands: "names",
        support: "support",
        donate: "support",
      };
      const id = map[cmd];
      if (id) openBayTo(id);
    },
    [openBayTo, setExpanded, toggle],
  );

  return (
    <>
      <a className="skip-link" href="#top">
        Skip to content
      </a>
      <AgeGate />
      {!booted ? <BootSequence onDone={() => setBooted(true)} /> : null}
      <div className="shell shell--ready shell--rack">
        <p className="agebanner" role="note">
          18+
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
            <button type="button" onClick={() => openBayTo("stream")}>
              stream
            </button>
            <button type="button" onClick={() => openBayTo("browse")}>
              browse
            </button>
            <a href="/footprint">footprint</a>
            <button type="button" onClick={() => openBayTo("support")}>
              support
            </button>
            {user?.isAdmin ? <a href="/admin">admin</a> : null}
          </nav>
          <div className="topbar__account">
            <span className="topbar__user" title={user?.email}>
              {user?.displayName ?? "member"}
            </span>
            <button type="button" className="topbar__logout" onClick={() => void logout()}>
              out
            </button>
          </div>
        </header>

        <main id="top" tabIndex={-1} className="rack">
          <Hero />
          <div className="cmd-wrap">
            <CommandBar onCommand={onCommand} onSearch={applySearch} />
          </div>

          <div className="rack__bays" role="list">
            <DriveBay
              id="stream"
              drive="A"
              label="STREAM"
              open={openBay === "stream"}
              onToggle={() => toggleBay("stream")}
            >
              <StreamDeck compact />
            </DriveBay>

            <DriveBay
              id="browse"
              drive="B"
              label="BROWSE"
              open={openBay === "browse"}
              onToggle={() => toggleBay("browse")}
            >
              <CategoryBrowser
                key={browseKey}
                compact
                initialQuery={searchQuery}
                initialCategory={searchCategory}
                initialSubcategory={searchSubcategory}
              />
            </DriveBay>

            <DriveBay
              id="chart"
              drive="C"
              label="CHART"
              open={openBay === "chart"}
              onToggle={() => toggleBay("chart")}
            >
              <CosmogramPanel compact />
            </DriveBay>

            <DriveBay
              id="names"
              drive="D"
              label="NAMES"
              open={openBay === "names"}
              onToggle={() => toggleBay("names")}
            >
              <AliasMatrix compact />
            </DriveBay>

            <DriveBay
              id="support"
              drive="E"
              label="SUPPORT"
              open={openBay === "support"}
              onToggle={() => toggleBay("support")}
            >
              <DonatePanel compact />
            </DriveBay>

            <DriveBay
              id="footprint-bay"
              drive="F"
              label="FOOTPRINT"
              open={false}
              onToggle={() => undefined}
              href="/footprint"
              meta="archive"
            />
          </div>
        </main>

        <footer className="footer">
          <p>
            © {new Date().getFullYear()} {PRIMARY_NAME}
          </p>
        </footer>

        <PlayerDock />
        <MagazineReader catalogId={openId} onClose={closeMagazine} />
      </div>
    </>
  );
}

export function AppShell() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <MagazineProvider>
          <ShellInner />
        </MagazineProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
