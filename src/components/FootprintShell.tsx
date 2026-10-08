"use client";

import Link from "next/link";
import { AgeGate } from "@/components/AgeGate";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { ReaderProvider, useReader } from "@/components/ReaderContext";
import { WritingReader } from "@/components/WritingReader";
import { PhotoGallery } from "@/components/PhotoGallery";
import { FootprintArchive } from "@/components/FootprintArchive";
import { PlayerDock } from "@/components/player/PlayerDock";
import { PlayerProvider } from "@/components/player/PlayerContext";
import { SiteFooter } from "@/components/SiteFooter";
import { BrandMark, BrandWatermark } from "@/components/BrandMark";
import type { FootprintItem } from "@/lib/feed";
import { SITE } from "@/data/identity";

function FootprintInner({ footprint }: { footprint: FootprintItem[] }) {
  const { user, logout } = useAuth();
  const {
    writingItem,
    gallery,
    closeWriting,
    closeGallery,
    setGalleryIndex,
  } = useReader();

  return (
    <>
      <a className="skip-link" href="#footprint-main">
        Skip to content
      </a>
      <AgeGate />
      <div className="shell shell--ready">
        <BrandWatermark />
        <p className="agebanner" role="note">
          18+
        </p>
        <header className="topbar">
          <Link className="topbar__brand" href="/">
            <BrandMark size={36} priority className="topbar__logo" />
            <span>
              <strong>{SITE.title}</strong>
              <small>{SITE.domain}</small>
            </span>
          </Link>
          <nav className="topbar__nav" aria-label="Primary">
            <Link href="/">home</Link>
            <Link href="/#stream">stream</Link>
            <Link href="/#browse">browse</Link>
            <Link href="/footprint" aria-current="page">
              footprint
            </Link>
            <Link href="/#support">support</Link>
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

        <main id="footprint-main" tabIndex={-1}>
          <FootprintArchive initial={footprint} />
        </main>

        <SiteFooter />
      </div>

      {/* Viewport-fixed overlays — outside .shell so transform/relative never traps them */}
      <PlayerDock />
      <WritingReader item={writingItem} onClose={closeWriting} />
      {gallery ? (
        <PhotoGallery
          items={gallery.items}
          index={gallery.index}
          onIndexChange={setGalleryIndex}
          onClose={closeGallery}
        />
      ) : null}
    </>
  );
}

export function FootprintShell({ footprint }: { footprint: FootprintItem[] }) {
  return (
    <AuthProvider>
      <PlayerProvider>
        <ReaderProvider>
          <FootprintInner footprint={footprint} />
        </ReaderProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
