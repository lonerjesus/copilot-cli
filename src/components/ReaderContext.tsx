"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

type ReaderContextValue = {
  writingItem: CatalogItem | null;
  gallery: GalleryState | null;
  openWriting: (item: CatalogItem) => void;
  openGallery: (item: CatalogItem, items?: CatalogItem[]) => void;
  /**
   * House writings → WritingReader; stills → PhotoGallery.
   * MagCloud is archive-only (House Atlas) — never required to open a writing.
   */
  openReadable: (item: CatalogItem, peers?: CatalogItem[]) => boolean;
  closeWriting: () => void;
  closeGallery: () => void;
  setGalleryIndex: (index: number) => void;
  closeAll: () => void;
  isReadable: (item: CatalogItem) => boolean;
};

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [writingItem, setWritingItem] = useState<CatalogItem | null>(null);
  const [gallery, setGallery] = useState<GalleryState | null>(null);

  const isReadable = useCallback((item: CatalogItem) => isReadableText(item), []);

  const openWriting = useCallback((item: CatalogItem) => {
    setGallery(null);
    setWritingItem(item);
    track("writing_open", { id: item.id, kind: item.kind, via: "house_writing" });
  }, []);

  const openGallery = useCallback((item: CatalogItem, items?: CatalogItem[]) => {
    if (!isPhotoStill(item)) return;
    const pool = photoCatalog(items?.length ? items : [item]);
    const withItem = pool.some((entry) => entry.id === item.id) ? pool : [item, ...pool];
    const index = Math.max(0, withItem.findIndex((entry) => entry.id === item.id));
    setWritingItem(null);
    setGallery({ items: withItem, index });
    track("writing_open", { id: item.id, kind: "still", via: "photo_gallery" });
  }, []);

  const openReadable = useCallback(
    (item: CatalogItem, peers?: CatalogItem[]) => {
      if (isPlayableMedia(item)) return false;
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
    [openGallery, openWriting],
  );

  const closeWriting = useCallback(() => setWritingItem(null), []);
  const closeGallery = useCallback(() => setGallery(null), []);
  const setGalleryIndex = useCallback((index: number) => {
    setGallery((g) => (g ? { ...g, index } : g));
  }, []);
  const closeAll = useCallback(() => {
    setWritingItem(null);
    setGallery(null);
  }, []);

  const value = useMemo(
    () => ({
      writingItem,
      gallery,
      openWriting,
      openGallery,
      openReadable,
      closeWriting,
      closeGallery,
      setGalleryIndex,
      closeAll,
      isReadable,
    }),
    [
      writingItem,
      gallery,
      openWriting,
      openGallery,
      openReadable,
      closeWriting,
      closeGallery,
      setGalleryIndex,
      closeAll,
      isReadable,
    ],
  );

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
}

export function useReader() {
  const ctx = useContext(ReaderContext);
  if (!ctx) throw new Error("useReader must be used within ReaderProvider");
  return ctx;
}
