"use client";

import Link from "next/link";
import { AgeGate } from "@/components/AgeGate";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { AdminStation } from "@/components/AdminStation";
import { SiteFooter } from "@/components/SiteFooter";
import { BrandMark, BrandWatermark } from "@/components/BrandMark";
import { IconAdmin, IconHome } from "@/components/NavIcons";
import { SITE } from "@/data/identity";

function AdminInner() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <main className="admin-gate">
        <p>…</p>
      </main>
    );
  }

  if (!user?.isAdmin) {
    return (
      <main className="admin-gate">
        <p className="section__eyebrow">denied</p>
        <h1>NO CLEARANCE</h1>
        <p className="admin-gate__hint">
          Signed in as <strong>{user?.email ?? "guest"}</strong>. Next: sign out, then sign in as
          the owner and open admin from the menu.
        </p>
        <div className="admin-gate__actions">
          <Link className="btn btn--ghost" href="/">
            home
          </Link>
          <button type="button" className="btn btn--ghost" onClick={() => void logout()}>
            sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <AgeGate />
      <div className="shell shell--ready">
        <BrandWatermark />
        <p className="agebanner" role="note">
          18+
        </p>
        <header className="topbar topbar--admin">
          <Link className="topbar__brand" href="/" aria-label={SITE.title}>
            <BrandMark size={36} priority className="topbar__logo" />
          </Link>
          <nav className="topbar__nav topbar__nav--icons" aria-label="Primary">
            <Link href="/" aria-label="home" title="home">
              <IconHome className="topbar__nav-icon" />
            </Link>
            <Link href="/admin" aria-current="page" aria-label="admin" title="admin">
              <IconAdmin className="topbar__nav-icon" />
            </Link>
          </nav>
          <div className="topbar__account">
            <span className="topbar__user" title={user.email}>
              {user.displayName}
            </span>
            <button type="button" className="topbar__logout" onClick={() => void logout()}>
              out
            </button>
          </div>
        </header>
        <main id="top" tabIndex={-1}>
          <AdminStation />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}

export function AdminShell() {
  return (
    <AuthProvider>
      <AdminInner />
    </AuthProvider>
  );
}
