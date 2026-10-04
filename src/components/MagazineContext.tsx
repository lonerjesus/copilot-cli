"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MAGAZINE_CATALOG_IDS } from "@/data/magazine";

type MagazineContextValue = {
  openId: string | null;
  openMagazine: (catalogId: string) => void;
  closeMagazine: () => void;
  hasMagazine: (catalogId: string) => boolean;
};

const MagazineContext = createContext<MagazineContextValue | null>(null);

export function MagazineProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const openMagazine = useCallback((catalogId: string) => {
    if (MAGAZINE_CATALOG_IDS.has(catalogId)) setOpenId(catalogId);
  }, []);

  const closeMagazine = useCallback(() => setOpenId(null), []);

  const hasMagazine = useCallback(
    (catalogId: string) => MAGAZINE_CATALOG_IDS.has(catalogId),
    [],
  );

  const value = useMemo(
    () => ({ openId, openMagazine, closeMagazine, hasMagazine }),
    [openId, openMagazine, closeMagazine, hasMagazine],
  );

  return <MagazineContext.Provider value={value}>{children}</MagazineContext.Provider>;
}

export function useMagazine() {
  const ctx = useContext(MagazineContext);
  if (!ctx) throw new Error("useMagazine must be used within MagazineProvider");
  return ctx;
}
