"use client";

import { useEffect, useState } from "react";
import { CATALOG, isPaywalled, type CatalogItem } from "@/data/catalog";
import { contentPriceCents, formatUsd } from "@/data/commerce";
import { useAuth } from "@/components/AuthContext";

type ContentPayActionsProps = {
  catalogId: string;
  title: string;
};

export function ContentPayActions({ catalogId, title }: ContentPayActionsProps) {
  const { owns, markOwned, refresh, loading: authLoading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [liveItem, setLiveItem] = useState<CatalogItem | undefined>(
    () => CATALOG.find((c) => c.id === catalogId),
  );
  const [catalogReady, setCatalogReady] = useState(() =>
    Boolean(CATALOG.find((c) => c.id === catalogId)),
  );

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/catalog", { credentials: "same-origin" });
        if (!res.ok) {
          if (alive) setCatalogReady(true);
          return;
        }
        const data = (await res.json()) as { items?: CatalogItem[] };
        const hit = data.items?.find((c) => c.id === catalogId);
        if (alive) {
          if (hit) setLiveItem(hit);
          setCatalogReady(true);
        }
      } catch {
        if (alive) setCatalogReady(true);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [catalogId]);

  const item = liveItem ?? CATALOG.find((c) => c.id === catalogId);
  const paywalled = item ? isPaywalled(item) : true;
  const owned = owns(catalogId);
  const price = formatUsd(contentPriceCents(catalogId));
  const ready = catalogReady && !authLoading;

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
        setMsg("owned");
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
      setMsg("network");
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
        setMsg(`pay · ${price}`);
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMsg(data.error ?? "denied");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${catalogId.replace(/[^A-Za-z0-9._-]+/g, "_")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMsg("network");
    } finally {
      setBusy(false);
    }
  };

  // Hold a single stable CTA until auth + catalog resolve (stops buy↔save flicker).
  if (!ready) {
    return (
      <div className="pay-actions pay-actions--pending" aria-busy="true">
        <button type="button" className="btn btn--ghost" disabled>
          …
        </button>
        <span className="pay-actions__title">{title}</span>
      </div>
    );
  }

  if (!paywalled) {
    return (
      <div className="pay-actions pay-actions--open">
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={download}>
          save
        </button>
        {msg ? <p className="pay-actions__msg">{msg}</p> : null}
      </div>
    );
  }

  return (
    <div className="pay-actions">
      {owned ? (
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={download}>
          save
        </button>
      ) : (
        <button type="button" className="btn btn--primary" disabled={busy} onClick={buy}>
          {busy ? "…" : `buy ${price}`}
        </button>
      )}
      <span className="pay-actions__title">{title}</span>
      {msg ? <p className="pay-actions__msg">{msg}</p> : null}
    </div>
  );
}
