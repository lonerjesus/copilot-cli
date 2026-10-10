"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { SITE } from "@/data/identity";
import { MIN_PASSWORD_LENGTH } from "@/data/commerce";
import { BrandMark, BrandWatermark } from "@/components/BrandMark";
import { track } from "@/lib/analytics";

type Mode = "login" | "register";

const VISITED_KEY = "kn.access.visited";

/** Block open redirects: only same-origin relative paths. */
function safeInternalPath(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (raw.includes("://") || raw.includes("\\")) return "/";
  return raw;
}

function initialMode(): Mode {
  if (typeof window === "undefined") return "register";
  const params = new URLSearchParams(window.location.search);
  const q = params.get("mode");
  if (q === "login" || q === "signin") return "login";
  if (q === "register" || q === "signup" || q === "create") return "register";
  // Returning visitors default to sign-in; first visit → create account.
  try {
    if (window.localStorage.getItem(VISITED_KEY) === "1") return "login";
  } catch {
    /* private mode */
  }
  return "register";
}

export function AccessGate() {
  const [mode, setMode] = useState<Mode>("register");
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

  useEffect(() => {
    const next = initialMode();
    setMode(next);
    track("access_mode", { mode: next });
    try {
      window.localStorage.setItem(VISITED_KEY, "1");
    } catch {
      /* private mode */
    }
  }, []);

  const nextPath = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const params = new URLSearchParams(window.location.search);
    return safeInternalPath(params.get("next"));
  }, []);

  const sessionNotice = useMemo(() => {
    if (typeof window === "undefined") return "";
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason === "session") {
      return "Signed out — only one login at a time. Sign in again on this device.";
    }
    if (reason === "logout") return "Signed out.";
    return "";
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
    const signalSubmit = mode === "login" ? "login_submit" : "register_submit";
    const signalOk = mode === "login" ? "login_ok" : "register_ok";
    const signalFail = mode === "login" ? "login_fail" : "register_fail";
    track(signalSubmit, { mode });
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
        track(signalFail, { mode, status: res.status });
        setError(data.error ?? "Request failed");
        return;
      }
      track(signalOk, { mode });
      window.location.href = nextPath;
    } catch {
      track(signalFail, { mode, status: 0 });
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="access" id="top">
      <BrandWatermark />
      <div className="access__atmosphere" aria-hidden>
        <div className="access__grid" />
      </div>
      <section className="access__panel" aria-labelledby="access-title">
        <p className="access__eyebrow">18+</p>
        <BrandMark size={96} priority className="access__logo" />
        <h1 id="access-title" className="access__brand">
          {SITE.title}
        </h1>
        <p className="access__tagline">{SITE.tagline}</p>
        <p className="access__copy">
          Create a free account to enter the house stream — audio, video, stills, and writings.
        </p>
        <p className="access__commerce">18+ · House downloads checkout via Stripe after sign-in.</p>
        {sessionNotice ? (
          <p className="access__notice" role="status" aria-live="polite">
            {sessionNotice}
          </p>
        ) : null}

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
            Enter Kamau’s Haus
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
            Enter Kamau’s Haus
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
                <span>birth date (18+)</span>
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
                    Password email reset is coming soon. Enter your email above to queue a request —
                    we never confirm whether an account exists.
                  </p>
                  <button
                    type="button"
                    className="btn"
                    disabled={forgotBusy || !email.trim()}
                    onClick={() => void requestPasswordReset()}
                  >
                    {forgotBusy ? "sending…" : "request reset"}
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
            {busy ? "Enter Kamau’s Haus…" : "Enter Kamau’s Haus"}
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
