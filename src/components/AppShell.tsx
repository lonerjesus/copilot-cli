"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AgeGate } from "@/components/AgeGate";
import { BootSequence } from "@/components/BootSequence";
import { CommandBar } from "@/components/CommandBar";
import { Hero } from "@/components/Hero";
import { StreamDeck } from "@/components/StreamDeck";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { CosmogramPanel } from "@/components/Cosmogram";
import { DriveBay } from "@/components/DriveBay";
import { MagazineReader } from "@/components/MagazineReader";
import { MagazineProvider, useMagazine } from "@/components/MagazineContext";
import { PlayerDock } from "@/components/player/PlayerDock";
import { PlayerProvider, usePlayerState } from "@/components/player/PlayerContext";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { DonatePanel } from "@/components/DonatePanel";
import { SiteFooter } from "@/components/SiteFooter";
import { BrandMark, BrandWatermark } from "@/components/BrandMark";
import { SITE } from "@/data/identity";
import { findCategoryByQuery, type CategoryId, type SubcategoryId } from "@/data/taxonomy";

type BayId = "stream" | "browse" | "chart" | "support";

function ShellInner() {
  const router = useRouter();
  const [booted, setBooted] = useState(false);
  const [openBay, setOpenBay] = useState<BayId | null>("stream");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<CategoryId | "all">("all");
  const [searchSubcategory, setSearchSubcategory] = useState<SubcategoryId | "all">("all");
  const [browseKey, setBrowseKey] = useState(0);
  const { toggle, setExpanded, next } = usePlayerState();
  const { openId, closeMagazine } = useMagazine();
  const { user, logout, refresh } = useAuth();

  const bayFromHash = useCallback((hash: string): BayId | null => {
    const id = hash.replace(/^#/, "").toLowerCase();
    if (id === "stream" || id === "browse" || id === "chart" || id === "support") {
      return id;
    }
    if (id === "categories") return "browse";
    if (id === "cosmogram") return "chart";
    if (id === "donate") return "support";
    return null;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchased") || params.get("donated") === "1") {
      void refresh();
    }
  }, [refresh]);

  useEffect(() => {
    const applyHash = () => {
      const bay = bayFromHash(window.location.hash);
      if (bay) setOpenBay(bay);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [bayFromHash]);

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
      if (cmd === "next") {
        setExpanded(true);
        next();
        return;
      }
      if (cmd === "queue") {
        setExpanded(true);
        openBayTo("stream");
        return;
      }
      if (cmd === "footprint") {
        router.push("/footprint");
        return;
      }
      const map: Record<string, BayId> = {
        stream: "stream",
        categories: "browse",
        magazine: "stream",
        cosmogram: "chart",
        support: "support",
        donate: "support",
      };
      const id = map[cmd];
      if (id) openBayTo(id);
    },
    [openBayTo, router, setExpanded, toggle, next],
  );

  return (
    <>
      <a className="skip-link" href="#top">
        Skip to content
      </a>
      <AgeGate />
      {!booted ? <BootSequence onDone={() => setBooted(true)} /> : null}
      <div className="shell shell--ready shell--rack">
        <BrandWatermark />
        <p className="agebanner" role="note">
          18+
        </p>
        <header className="topbar">
          <a className="topbar__brand" href="#top">
            <BrandMark size={36} priority className="topbar__logo" />
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
            <Link href="/footprint">footprint</Link>
            <button type="button" onClick={() => openBayTo("support")}>
              support
            </button>
            {user?.isAdmin ? <Link href="/admin">admin</Link> : null}
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

          <div className="rack__bays">
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
              id="support"
              drive="D"
              label="SUPPORT"
              open={openBay === "support"}
              onToggle={() => toggleBay("support")}
            >
              <DonatePanel compact />
            </DriveBay>

            <DriveBay
              id="footprint-bay"
              drive="E"
              label="FOOTPRINT"
              open={false}
              onToggle={() => undefined}
              href="/footprint"
              meta="archive"
            />
          </div>
        </main>

        <SiteFooter />

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
