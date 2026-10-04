"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getQueue, type CatalogItem } from "@/data/catalog";

type PlayerContextValue = {
  queue: CatalogItem[];
  current: CatalogItem | null;
  index: number;
  playing: boolean;
  expanded: boolean;
  progress: number;
  playItem: (item: CatalogItem, queue?: CatalogItem[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  setExpanded: (value: boolean) => void;
  setProgress: (value: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => getQueue(), []);
  const [queue, setQueue] = useState<CatalogItem[]>(initial);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);

  const current = queue[index] ?? null;

  const clearTimer = () => {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  };

  const next = useCallback(() => {
    setIndex((i) => (queue.length ? (i + 1) % queue.length : 0));
    setProgress(0);
    setPlaying(true);
  }, [queue.length]);

  const prev = useCallback(() => {
    setIndex((i) => (queue.length ? (i - 1 + queue.length) % queue.length : 0));
    setProgress(0);
    setPlaying(true);
  }, [queue.length]);

  const playItem = useCallback((item: CatalogItem, nextQueue?: CatalogItem[]) => {
    const q = nextQueue ?? queue;
    const found = q.findIndex((entry) => entry.id === item.id);
    if (nextQueue) setQueue(nextQueue);
    if (found >= 0) {
      setIndex(found);
    } else {
      setQueue([item, ...q]);
      setIndex(0);
    }
    setProgress(0);
    setPlaying(true);
    setExpanded(true);
  }, [queue]);

  const toggle = useCallback(() => setPlaying((p) => !p), []);

  useEffect(() => {
    clearTimer();
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + 0.35;
      });
    }, 120);
    return clearTimer;
  }, [playing, next, current?.id]);

  const value = useMemo(
    () => ({
      queue,
      current,
      index,
      playing,
      expanded,
      progress,
      playItem,
      toggle,
      next,
      prev,
      setExpanded,
      setProgress,
    }),
    [queue, current, index, playing, expanded, progress, playItem, toggle, next, prev],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
