"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthContext";
import { buildPersonalChart } from "@/lib/chart";
import { track } from "@/lib/analytics";

/**
 * Cosmogram is personal to the signed-in member (from their birth date).
 * Never shows house legal / birth-certificate names.
 */
export function CosmogramPanel({ compact = false }: { compact?: boolean }) {
  const { user, refresh } = useAuth();
  const seen = useRef(false);
  const [draftDob, setDraftDob] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const node = document.getElementById("chart") ?? document.getElementById("cosmogram");
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
    <section
      className={`section cosmogram ${compact ? "section--compact" : ""}`}
      aria-label="Chart"
    >
      {!compact ? (
        <header className="section__head">
          <div>
            <h2 id="cosmo-title">CHART</h2>
          </div>
        </header>
      ) : null}

      {!chart ? (
        <form className="cosmo-setup" onSubmit={saveDob}>
          <label>
            <span>DOB</span>
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
            {busy ? "…" : "load"}
          </button>
        </form>
      ) : (
        <div className="cosmo-hero cosmo-hero--compact">
          <p className="cosmo-hero__name">{chart.displayName}</p>
          <div className="cosmo-hero__glyphs" aria-label="Core numbers">
            <div>
              <span>SUN</span>
              <strong>{chart.sunSign}</strong>
            </div>
            <div>
              <span>PATH</span>
              <strong>{chart.lifePath}</strong>
            </div>
            <div>
              <span>DAY</span>
              <strong>{chart.birthdayNumber}</strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
