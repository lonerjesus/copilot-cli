"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthContext";
import { buildPersonalChart, CHART_COPY } from "@/lib/chart";
import { track } from "@/lib/analytics";

/**
 * Cosmogram is personal to the signed-in member (from their birth date).
 * Never shows house legal / birth-certificate names.
 */
export function CosmogramPanel() {
  const { user, refresh } = useAuth();
  const seen = useRef(false);
  const [draftDob, setDraftDob] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const node = document.getElementById("cosmogram");
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !seen.current) {
          seen.current = true;
          track("cosmogram_view");
        }
      },
      { threshold: 0.35 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const chart = useMemo(() => {
    if (!user?.birthDate) return null;
    try {
      return buildPersonalChart(user.displayName, user.birthDate);
    } catch {
      return null;
    }
  }, [user]);

  const saveDob = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ birthDate: draftDob }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      await refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="cosmogram" className="section cosmogram" aria-labelledby="cosmo-title">
      <header className="section__head">
        <div>
          <h2 id="cosmo-title">{CHART_COPY.title}</h2>
        </div>
      </header>

      {!chart ? (
        <form className="cosmo-setup" onSubmit={saveDob}>
          <label>
            <span>birth date (18+ · unlocks your cosmogram)</span>
            <input
              type="date"
              required
              value={draftDob}
              onChange={(e) => setDraftDob(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </label>
          {error ? (
            <p className="access__error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "saving…" : "generate my chart"}
          </button>
        </form>
      ) : (
        <>
          <div className="cosmo-hero">
            <div>
              <p className="cosmo-hero__name">{chart.displayName}</p>
              <p className="cosmo-hero__aka">personal signal · member chart</p>
            </div>
            <div className="cosmo-hero__glyphs" aria-label="Core numbers">
              <div>
                <span>SUN</span>
                <strong>{chart.sunSign}</strong>
              </div>
              <div>
                <span>LIFE PATH</span>
                <strong>{chart.lifePath}</strong>
              </div>
              <div>
                <span>BIRTHDAY</span>
                <strong>{chart.birthdayNumber}</strong>
              </div>
            </div>
          </div>

          <ul className="cosmo-pillars">
            {CHART_COPY.pillars(chart.sunSign, chart.lifePath, chart.birthdayNumber).map(
              (pillar) => (
                <li key={pillar.label}>
                  <strong>{pillar.label}</strong>
                  <p>{pillar.line}</p>
                </li>
              ),
            )}
          </ul>

          <div className="cosmo-grid">
            <div>
              <h3>AFFIRMATIONS</h3>
              <ul className="cosmo-affirms">
                {CHART_COPY.affirmations.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
