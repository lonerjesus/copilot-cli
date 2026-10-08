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
import {
  isPlayableMedia,
  isReadableText,
  type CatalogItem,
} from "@/data/catalog";
import { track } from "@/lib/analytics";

type MagazineContextValue = {
  openId: string | null;
  writingItem: CatalogItem | null;
  openMagazine: (catalogId: string) => void;
  openWriting: (item: CatalogItem) => void;
  /** Open magazine, writing reader, or no-op — never silent for readable text. */
  openReadable: (item: CatalogItem) => boolean;
  closeMagazine: () => void;
  closeWriting: () => void;
  closeAll: () => void;
  hasMagazine: (catalogId: string) => boolean;
  isReadable: (item: CatalogItem) => boolean;
};

const MagazineContext = createContext<MagazineContextValue | null>(null);

export function MagazineProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [writingItem, setWritingItem] = useState<CatalogItem | null>(null);

  const hasMagazine = useCallback(
    (catalogId: string) => MAGAZINE_CATALOG_IDS.has(catalogId),
    [],
  );

  const isReadable = useCallback(
    (item: CatalogItem) => hasMagazine(item.id) || isReadableText(item),
    [hasMagazine],
  );

  const openMagazine = useCallback((catalogId: string) => {
    if (!MAGAZINE_CATALOG_IDS.has(catalogId)) return;
    setWritingItem(null);
    setOpenId(catalogId);
    track("magazine_open", { id: catalogId });
  }, []);

  const openWriting = useCallback((item: CatalogItem) => {
    setOpenId(null);
    setWritingItem(item);
    track("writing_open", { id: item.id, kind: item.kind });
  }, []);

  const openReadable = useCallback(
    (item: CatalogItem) => {
      if (isPlayableMedia(item)) return false;
      if (hasMagazine(item.id)) {
        openMagazine(item.id);
        return true;
      }
      if (isReadableText(item)) {
        openWriting(item);
        return true;
      }
      return false;
    },
    [hasMagazine, openMagazine, openWriting],
  );

  const closeMagazine = useCallback(() => setOpenId(null), []);
  const closeWriting = useCallback(() => setWritingItem(null), []);
  const closeAll = useCallback(() => {
    setOpenId(null);
    setWritingItem(null);
  }, []);

  const value = useMemo(
    () => ({
      openId,
      writingItem,
      openMagazine,
      openWriting,
      openReadable,
      closeMagazine,
      closeWriting,
      closeAll,
      hasMagazine,
      isReadable,
    }),
    [
      openId,
      writingItem,
      openMagazine,
      openWriting,
      openReadable,
      closeMagazine,
      closeWriting,
      closeAll,
      hasMagazine,
      isReadable,
    ],
  );

  return <MagazineContext.Provider value={value}>{children}</MagazineContext.Provider>;
}

export function useMagazine() {
  const ctx = useContext(MagazineContext);
  if (!ctx) throw new Error("useMagazine must be used within MagazineProvider");
  return ctx;
}
