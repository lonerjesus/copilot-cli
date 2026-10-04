"use client";

import { useState } from "react";
import { CATALOG, isPaywalled } from "@/data/catalog";
import { contentPriceCents, formatUsd } from "@/data/commerce";
import { useAuth } from "@/components/AuthContext";

type ContentPayActionsProps = {
  catalogId: string;
  title: string;
};

export function ContentPayActions({ catalogId, title }: ContentPayActionsProps) {
  const { owns, markOwned, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const item = CATALOG.find((c) => c.id === catalogId);
  const paywalled = item ? isPaywalled(item) : true;
  const owned = owns(catalogId);
  const price = formatUsd(contentPriceCents(catalogId));

  const buy = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/commerce/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ catalogId }),
      });
      const data = (await res.json()) as {
        url?: string;
        alreadyOwned?: boolean;
        mode?: string;
        error?: string;
      };
      if (!res.ok) {
        setMsg(data.error ?? "Purchase failed");
        return;
      }
      if (data.alreadyOwned) {
        markOwned(catalogId);
        setMsg("Already licensed");
        return;
      }
      if (data.mode === "demo") {
        await refresh();
        markOwned(catalogId);
      }
      if (data.url) {
        window.location.assign(data.url);
      }
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/commerce/download?id=${encodeURIComponent(catalogId)}`, {
        credentials: "same-origin",
      });
      if (res.status === 402) {
        setMsg(`Purchase required · ${price}`);
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMsg(data.error ?? "Download denied");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${catalogId}.kn.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg(`Saved · ${title}`);
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  };

  // Fetched / scraped media — no paywall chrome
  if (!paywalled) {
    return (
      <div className="pay-actions pay-actions--open">
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={download}>
          {busy ? "…" : "save reference"}
        </button>
        <span className="pay-actions__hint">fetched source · free for members</span>
        {msg ? <span className="pay-actions__msg">{msg}</span> : null}
      </div>
    );
  }

  return (
    <div className="pay-actions">
      {owned ? (
        <button type="button" className="btn btn--primary" disabled={busy} onClick={download}>
          {busy ? "…" : "download / save"}
        </button>
      ) : (
        <button type="button" className="btn btn--primary" disabled={busy} onClick={buy}>
          {busy ? "…" : `unlock · ${price}`}
        </button>
      )}
      <span className="pay-actions__hint">
        {owned ? "licensed upload" : "house upload · purchase to save"}
      </span>
      {msg ? <span className="pay-actions__msg">{msg}</span> : null}
    </div>
  );
}
