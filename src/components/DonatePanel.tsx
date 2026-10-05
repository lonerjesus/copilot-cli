"use client";

import { useState } from "react";
import { DONATION_PRESETS_CENTS, formatUsd, MIN_DONATION_CENTS, MAX_DONATION_CENTS } from "@/data/commerce";
import { useAuth } from "@/components/AuthContext";
import { track } from "@/lib/analytics";

export function DonatePanel({ compact = false }: { compact?: boolean }) {
  const { user, refresh } = useAuth();
  const [cents, setCents] = useState<number>(DONATION_PRESETS_CENTS[1]);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (!user) return null;

  const submit = async () => {
    setBusy(true);
    setMessage("");
    try {
      const amount =
        custom.trim() !== ""
          ? Math.round(Number(custom) * 100)
          : cents;
      if (!Number.isFinite(amount) || amount < MIN_DONATION_CENTS) {
        setMessage(`min ${formatUsd(MIN_DONATION_CENTS)}`);
        return;
      }
      if (amount > MAX_DONATION_CENTS) {
        setMessage(`max ${formatUsd(MAX_DONATION_CENTS)}`);
        return;
      }
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ cents: amount }),
      });
      const data = (await res.json()) as { url?: string; error?: string; mode?: string };
      if (!res.ok) {
        setMessage(data.error ?? "fail");
        return;
      }
      track("command", { cmd: "donate", cents: amount });
      await refresh();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setMessage("network");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={`section donate ${compact ? "section--compact" : ""}`}
      aria-label="Support"
    >
      {!compact ? (
        <header className="section__head">
          <div>
            <h2 id="donate-title">SUPPORT</h2>
          </div>
        </header>
      ) : null}

      <div className="donate__row">
        {DONATION_PRESETS_CENTS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`donate__chip ${cents === preset && !custom ? "is-on" : ""}`}
            onClick={() => {
              setCents(preset);
              setCustom("");
            }}
          >
            {formatUsd(preset)}
          </button>
        ))}
        <label className="donate__custom">
          <span>$</span>
          <input
            inputMode="decimal"
            placeholder="12"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </label>
        <button type="button" className="btn btn--primary" disabled={busy} onClick={submit}>
          {busy ? "…" : "give"}
        </button>
      </div>
      {user.donatedCentsTotal > 0 ? (
        <p className="donate__thanks">{formatUsd(user.donatedCentsTotal)}</p>
      ) : null}
      {message ? (
        <p className="donate__msg" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
