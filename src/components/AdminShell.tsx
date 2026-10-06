"use client";

import Link from "next/link";
import { AgeGate } from "@/components/AgeGate";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { AdminStation } from "@/components/AdminStation";
import { SiteFooter } from "@/components/SiteFooter";
import { BrandMark, BrandWatermark } from "@/components/BrandMark";
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
          Signed in as <strong>{user?.email ?? "guest"}</strong>. Sign in as the owner, then use
          admin in the menu.
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
        <header className="topbar">
          <Link className="topbar__brand" href="/">
            <BrandMark size={36} priority className="topbar__logo" />
            <span>
              <strong>{SITE.title}</strong>
              <small>admin</small>
            </span>
          </Link>
          <nav className="topbar__nav" aria-label="Primary">
            <Link href="/">home</Link>
            <Link href="/admin" aria-current="page">
              admin
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
