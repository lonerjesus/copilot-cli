"use client";

import { useEffect, useState } from "react";
import { CATALOG, houseCatalog, type CatalogItem } from "@/data/catalog";
import { useAuth } from "@/components/AuthContext";

/**
 * Shared house catalog for Stream + Browse.
 * Waits for auth before fetching so we don't paint 0/0 on a 401 race.
 */
export function useLiveCatalog(): {
  items: CatalogItem[];
  loading: boolean;
  error: boolean;
} {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>(() => houseCatalog(CATALOG));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setItems([]);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);

    const load = async () => {
      try {
        const res = await fetch("/api/catalog", {
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = (await res.json()) as { items?: CatalogItem[] };
        setItems(houseCatalog(data.items ?? []));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [user, authLoading]);

  return { items, loading: authLoading || loading, error };
}
