"use client";

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
      <div className="shell shell--ready">
        <p className="agebanner" role="note">
          18+
        </p>
        <header className="topbar">
          <a className="topbar__brand" href="/">
            <span className="topbar__mark">KN</span>
            <span>
              <strong>{SITE.title}</strong>
              <small>{SITE.domain}</small>
            </span>
          </a>
          <nav className="topbar__nav" aria-label="Primary">
            <a href="/">home</a>
            <a href="/#stream">stream</a>
            <a href="/#categories">browse</a>
            <a href="/footprint" aria-current="page">
              footprint
            </a>
            <a href="/#support">support</a>
            {user?.isAdmin ? <a href="/admin">admin</a> : null}
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
