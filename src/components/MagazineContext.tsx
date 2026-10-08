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
  isPhotoStill,
  isPlayableMedia,
  isReadableText,
  photoCatalog,
  type CatalogItem,
} from "@/data/catalog";
import { track } from "@/lib/analytics";

type GalleryState = {
  items: CatalogItem[];
  index: number;
};

type MagazineContextValue = {
  openId: string | null;
  writingItem: CatalogItem | null;
  gallery: GalleryState | null;
  openMagazine: (catalogId: string) => void;
  openWriting: (item: CatalogItem) => void;
  openGallery: (item: CatalogItem, items?: CatalogItem[]) => void;
  /** Open magazine, photo gallery, writing reader, or no-op — never silent for readable text. */
  openReadable: (item: CatalogItem, peers?: CatalogItem[]) => boolean;
  closeMagazine: () => void;
  closeWriting: () => void;
  closeGallery: () => void;
  setGalleryIndex: (index: number) => void;
  closeAll: () => void;
  hasMagazine: (catalogId: string) => boolean;
  isReadable: (item: CatalogItem) => boolean;
};

const MagazineContext = createContext<MagazineContextValue | null>(null);

export function MagazineProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [writingItem, setWritingItem] = useState<CatalogItem | null>(null);
  const [gallery, setGallery] = useState<GalleryState | null>(null);

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
    setGallery(null);
    setOpenId(catalogId);
    track("magazine_open", { id: catalogId });
  }, []);

  const openWriting = useCallback((item: CatalogItem) => {
    setOpenId(null);
    setGallery(null);
    setWritingItem(item);
    track("writing_open", { id: item.id, kind: item.kind });
  }, []);

  const openGallery = useCallback((item: CatalogItem, items?: CatalogItem[]) => {
    if (!isPhotoStill(item)) return;
    const pool = photoCatalog(items?.length ? items : [item]);
    const withItem = pool.some((entry) => entry.id === item.id) ? pool : [item, ...pool];
    const index = Math.max(0, withItem.findIndex((entry) => entry.id === item.id));
    setOpenId(null);
    setWritingItem(null);
    setGallery({ items: withItem, index });
    track("writing_open", { id: item.id, kind: "still", via: "gallery" });
  }, []);

  const openReadable = useCallback(
    (item: CatalogItem, peers?: CatalogItem[]) => {
      if (isPlayableMedia(item)) return false;
      if (hasMagazine(item.id)) {
        openMagazine(item.id);
        return true;
      }
      if (isPhotoStill(item)) {
        openGallery(item, peers);
        return true;
      }
      if (isReadableText(item)) {
        openWriting(item);
        return true;
      }
      return false;
    },
    [hasMagazine, openMagazine, openGallery, openWriting],
  );

  const closeMagazine = useCallback(() => setOpenId(null), []);
  const closeWriting = useCallback(() => setWritingItem(null), []);
  const closeGallery = useCallback(() => setGallery(null), []);
  const setGalleryIndex = useCallback((index: number) => {
    setGallery((g) => (g ? { ...g, index } : g));
  }, []);
  const closeAll = useCallback(() => {
    setOpenId(null);
    setWritingItem(null);
    setGallery(null);
  }, []);

  const value = useMemo(
    () => ({
      openId,
      writingItem,
      gallery,
      openMagazine,
      openWriting,
      openGallery,
      openReadable,
      closeMagazine,
      closeWriting,
      closeGallery,
      setGalleryIndex,
      closeAll,
      hasMagazine,
      isReadable,
    }),
    [
      openId,
      writingItem,
      gallery,
      openMagazine,
      openWriting,
      openGallery,
      openReadable,
      closeMagazine,
      closeWriting,
      closeGallery,
      setGalleryIndex,
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
