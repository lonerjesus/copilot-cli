"use client";

import { AuthProvider, useAuth } from "@/components/AuthContext";
import { AdminStation } from "@/components/AdminStation";
import { PRIMARY_NAME, SITE } from "@/data/identity";

function AdminInner() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <main className="admin-gate">
        <p>checking clearance…</p>
      </main>
    );
  }

  if (!user?.isAdmin) {
    return (
      <main className="admin-gate">
        <p className="section__eyebrow">denied</p>
        <h1>NO CLEARANCE</h1>
        <a className="btn btn--ghost" href="/">
          home
        </a>
      </main>
    );
  }

  return (
    <div className="shell shell--ready">
      <header className="topbar">
        <a className="topbar__brand" href="/">
          <span className="topbar__mark">KN</span>
          <span>
            <strong>{SITE.title}</strong>
            <small>admin</small>
          </span>
        </a>
        <nav className="topbar__nav" aria-label="Primary">
          <a href="/">home</a>
          <a href="/footprint">footprint</a>
          <a href="/admin" aria-current="page">
            admin
          </a>
        </nav>
        <div className="topbar__account">
          <span className="topbar__user" title={user.email}>
            {user.displayName}
          </span>
          <button type="button" className="topbar__logout" onClick={() => void logout()}>
            sign out
          </button>
        </div>
      </header>
      <main id="top" tabIndex={-1}>
        <AdminStation />
      </main>
      <footer className="footer">
        <p>
          © {new Date().getFullYear()} {PRIMARY_NAME} · admin station · owner only
        </p>
      </footer>
    </div>
  );
}

export function AdminShell() {
  return (
    <AuthProvider>
      <AdminInner />
    </AuthProvider>
  );
}
