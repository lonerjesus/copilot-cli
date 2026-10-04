"use client";

import { useMemo, useState, type FormEvent } from "react";
import { SITE } from "@/data/identity";

type Mode = "login" | "register";

export function AccessGate() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    return next && next.startsWith("/") ? next : "/";
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email,
          password,
          displayName,
          ageConfirmed,
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      window.location.href = nextPath;
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="access" id="top">
      <div className="access__atmosphere" aria-hidden>
        <div className="access__grid" />
      </div>
      <section className="access__panel" aria-labelledby="access-title">
        <p className="access__eyebrow">account required · anti-scrape gate</p>
        <h1 id="access-title" className="access__brand">
          {SITE.title}
        </h1>
        <p className="access__copy">
          Create an account to enter the stream. Bots and automated fetchers are blocked. Downloads
          and saves require a paid license per piece. Donations keep {SITE.domain} online.
        </p>

        <div className="access__tabs" role="tablist" aria-label="Account mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "is-on" : ""}
            onClick={() => setMode("login")}
          >
            sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={mode === "register" ? "is-on" : ""}
            onClick={() => setMode("register")}
          >
            create account
          </button>
        </div>

        <form className="access__form" onSubmit={submit} autoComplete="on">
          {/* honeypot — must stay invisible to humans */}
          <div className="hp" aria-hidden="true">
            <label htmlFor="access-website">website</label>
            <input
              id="access-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {mode === "register" ? (
            <label>
              <span>display name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="how we greet you"
                maxLength={64}
              />
            </label>
          ) : null}

          <label>
            <span>email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            <span>password {mode === "register" ? "(≥10 chars)" : ""}</span>
            <input
              type="password"
              required
              minLength={mode === "register" ? 10 : 1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {mode === "register" ? (
            <label className="access__check">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                required
              />
              <span>I confirm I am 18 or older (required)</span>
            </label>
          ) : null}

          {error ? (
            <p className="access__error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "securing…" : mode === "login" ? "enter stream" : "create & enter"}
          </button>
        </form>

        <p className="access__fine">
          Viewing requires an account. Saving or downloading any piece requires purchasing that
          piece. Redistribution is prohibited.
        </p>
      </section>
    </main>
  );
}
