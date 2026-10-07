"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AgeGate } from "@/components/AgeGate";
import { BootSequence } from "@/components/BootSequence";
import { Hero } from "@/components/Hero";
import { StreamDeck } from "@/components/StreamDeck";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { MagazineReader } from "@/components/MagazineReader";
import { MagazineProvider, useMagazine } from "@/components/MagazineContext";
import { PlayerDock } from "@/components/player/PlayerDock";
import { PlayerProvider, usePlayerState } from "@/components/player/PlayerContext";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { DonatePanel } from "@/components/DonatePanel";
import { SiteFooter } from "@/components/SiteFooter";
import { BrandMark, BrandWatermark } from "@/components/BrandMark";
import { SITE } from "@/data/identity";

type ViewId = "stream" | "browse" | "support";

function ShellInner() {
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState<ViewId>("stream");
  const [menuOpen, setMenuOpen] = useState(false);
  const { setExpanded, toggle } = usePlayerState();
  const { openId, closeMagazine } = useMagazine();
  const { user, logout, refresh } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchased") || params.get("donated") === "1") {
      void refresh();
    }
  }, [refresh]);

  useEffect(() => {
    const applyHash = () => {
      const id = window.location.hash.replace(/^#/, "").toLowerCase();
      if (id === "stream" || id === "browse" || id === "support") setView(id);
      if (id === "categories") setView("browse");
      if (id === "donate") setView("support");
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const go = useCallback((id: ViewId) => {
    setView(id);
    setMenuOpen(false);
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  const nav: { id: ViewId; label: string }[] = [
    { id: "stream", label: "stream" },
    { id: "browse", label: "browse" },
    { id: "support", label: "support" },
  ];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip
      </a>
      <AgeGate />
      {!booted ? <BootSequence onDone={() => setBooted(true)} /> : null}
      <div className={`shell shell--ready shell--rail ${menuOpen ? "shell--menu" : ""}`}>
        <BrandWatermark />
        <p className="agebanner" role="note">
          18+
        </p>

        <div className="shell__rail-layout">
          <aside className="rail" aria-label="Menu">
            <Link className="rail__brand" href="#stream" onClick={() => go("stream")}>
              <BrandMark size={28} priority className="rail__logo" />
              <strong>{SITE.title}</strong>
            </Link>

            <nav className="rail__nav">
              {nav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={view === item.id ? "is-active" : undefined}
                  aria-current={view === item.id ? "page" : undefined}
                  onClick={() => go(item.id)}
                >
                  {item.label}
                </button>
              ))}
              {user?.isAdmin ? (
                <Link href="/admin" onClick={() => setMenuOpen(false)}>
                  admin
                </Link>
              ) : null}
            </nav>

            <div className="rail__foot">
              <span className="rail__user" title={user?.email}>
                {user?.displayName ?? "·"}
              </span>
              <button type="button" className="rail__out" onClick={() => void logout()}>
                out
              </button>
            </div>
          </aside>

          <button
            type="button"
            className="rail-toggle"
            aria-expanded={menuOpen}
            aria-controls="main"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "×" : "☰"}
          </button>
          {menuOpen ? (
            <button
              type="button"
              className="rail-scrim"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
          ) : null}

          <div className="rail__stage">
            <main id="main" tabIndex={-1} className="stage">
              {view === "stream" ? (
                <>
                  <Hero
                    onStream={() => {
                      setExpanded(true);
                      toggle();
                    }}
                  />
                  <StreamDeck compact />
                </>
              ) : null}

              {view === "browse" ? <CategoryBrowser compact /> : null}

              {view === "support" ? <DonatePanel compact /> : null}
            </main>
            <SiteFooter />
          </div>
        </div>

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
