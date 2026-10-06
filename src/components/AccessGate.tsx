"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { SITE } from "@/data/identity";
import { MIN_PASSWORD_LENGTH } from "@/data/commerce";

type Mode = "login" | "register";

/** Block open redirects: only same-origin relative paths. */
function safeInternalPath(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (raw.includes("://") || raw.includes("\\")) return "/";
  return raw;
}

export function AccessGate() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotStatus, setForgotStatus] = useState("");

  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const params = new URLSearchParams(window.location.search);
    return safeInternalPath(params.get("next"));
  }, []);

  const passwordHint =
    mode === "register"
      ? password.length === 0
        ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
        : password.length < MIN_PASSWORD_LENGTH
          ? `${password.length}/${MIN_PASSWORD_LENGTH} — keep going.`
          : `${password.length} characters · ready.`
      : null;

  const requestPasswordReset = async () => {
    setForgotStatus("");
    setForgotBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, website }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setForgotStatus(data.error ?? "Request failed");
        return;
      }
      setForgotStatus(
        data.message ??
          "If an account exists for that email, a reset link will be sent when email reset is enabled.",
      );
    } catch {
      setForgotStatus("Network error");
    } finally {
      setForgotBusy(false);
    }
  };

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
          birthDate: mode === "register" ? birthDate : undefined,
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
        <p className="access__eyebrow">18+</p>
        <h1 id="access-title" className="access__brand">
          {SITE.title}
        </h1>
        <p className="access__tagline">{SITE.tagline}</p>
        <p className="access__copy">Account required.</p>
        <p className="access__commerce">
          House downloads checkout via Stripe after sign-in. Fetched platform streams stay free for
          members.
        </p>

        <div className="access__tabs" role="tablist" aria-label="Account mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "is-on" : ""}
            onClick={() => {
              setMode("login");
              setForgotOpen(false);
              setError("");
            }}
          >
            sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={mode === "register" ? "is-on" : ""}
            onClick={() => {
              setMode("register");
              setForgotOpen(false);
              setError("");
            }}
          >
            create account
          </button>
        </div>

        <form className="access__form" onSubmit={submit} autoComplete="on">
          {/* honeypot — no visible label text; off-canvas only */}
          <input
            className="hp"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />

          {mode === "register" ? (
            <>
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
              <label>
                <span>birth date (for your cosmogram · 18+)</span>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </label>
            </>
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

          <div className="access__password">
            <label className="access__password-label">
              <span>password</span>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={mode === "register" ? MIN_PASSWORD_LENGTH : 1}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>
            <button
              type="button"
              className="access__reveal"
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "hide" : "show"}
            </button>
          </div>
          {passwordHint ? (
            <p
              className={
                password.length >= MIN_PASSWORD_LENGTH
                  ? "access__hint access__hint--ok"
                  : "access__hint"
              }
              aria-live="polite"
            >
              {passwordHint}
            </p>
          ) : null}

          {mode === "login" ? (
            <div className="access__forgot">
              <button
                type="button"
                className="access__forgot-toggle"
                aria-expanded={forgotOpen}
                onClick={() => {
                  setForgotOpen((v) => !v);
                  setForgotStatus("");
                }}
              >
                Forgot password?
              </button>
              {forgotOpen ? (
                <div className="access__forgot-panel">
                  <p className="access__forgot-stub" role="status">
                    Email reset is not live yet (Auth pack). You can still POST the stub with the
                    email above — we never confirm whether an account exists.
                  </p>
                  <button
                    type="button"
                    className="btn"
                    disabled={forgotBusy || !email.trim()}
                    onClick={() => void requestPasswordReset()}
                  >
                    {forgotBusy ? "sending…" : "request reset stub"}
                  </button>
                  {forgotStatus ? (
                    <p className="access__hint" role="status">
                      {forgotStatus}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

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
          Viewing requires an account. Redistribution is prohibited.
        </p>
        <nav className="access__legal" aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <span aria-hidden>·</span>
          <Link href="/terms">Terms</Link>
        </nav>
      </section>
    </main>
  );
}
