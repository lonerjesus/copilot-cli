"use client";

import Link from "next/link";
import { AgeGate } from "@/components/AgeGate";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { MagazineProvider, useMagazine } from "@/components/MagazineContext";
import { MagazineReader } from "@/components/MagazineReader";
import { FootprintArchive } from "@/components/FootprintArchive";
import { PlayerDock } from "@/components/player/PlayerDock";
import { PlayerProvider } from "@/components/player/PlayerContext";
import type { FootprintItem } from "@/lib/feed";
import { PRIMARY_NAME, SITE } from "@/data/identity";

function FootprintInner({ footprint }: { footprint: FootprintItem[] }) {
  const { user, logout } = useAuth();
  const { openId, closeMagazine } = useMagazine();

  return (
    <>
      <a className="skip-link" href="#footprint-main">
        Skip to content
      </a>
      <AgeGate />
      <div className="shell shell--ready">
        <p className="agebanner" role="note">
          18+
        </p>
        <header className="topbar">
          <Link className="topbar__brand" href="/">
            <span className="topbar__mark">KN</span>
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

export function FootprintShell({ footprint }: { footprint: FootprintItem[] }) {
  return (
    <AuthProvider>
      <PlayerProvider>
        <MagazineProvider>
          <FootprintInner footprint={footprint} />
        </MagazineProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
