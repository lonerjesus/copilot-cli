"use client";

import Link from "next/link";
import { AgeGate } from "@/components/AgeGate";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { AdminStation } from "@/components/AdminStation";
import { SiteFooter } from "@/components/SiteFooter";
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
        <Link className="btn btn--ghost" href="/">
          home
        </Link>
      </main>
    );
  }

  return (
    <>
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
              <small>admin</small>
            </span>
          </Link>
          <nav className="topbar__nav" aria-label="Primary">
            <Link href="/">home</Link>
            <Link href="/footprint">footprint</Link>
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
