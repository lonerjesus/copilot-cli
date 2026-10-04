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

type PlayerStateValue = {
  queue: CatalogItem[];
  current: CatalogItem | null;
  index: number;
  playing: boolean;
  expanded: boolean;
  playItem: (item: CatalogItem, queue?: CatalogItem[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  setExpanded: (value: boolean) => void;
};

type PlayerProgressValue = {
  progress: number;
  setProgress: (value: number) => void;
};

const PlayerStateContext = createContext<PlayerStateValue | null>(null);
const PlayerProgressContext = createContext<PlayerProgressValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => getQueue(), []);
  const [queue, setQueue] = useState<CatalogItem[]>(initial);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);

  const current = queue[index] ?? initial[0] ?? null;

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

  const state = useMemo(
    () => ({
      queue,
      current,
      index,
      playing,
      expanded,
      playItem,
      toggle,
      next,
      prev,
      setExpanded,
    }),
    [queue, current, index, playing, expanded, playItem, toggle, next, prev],
  );

  const progressValue = useMemo(
    () => ({ progress, setProgress }),
    [progress],
  );

  return (
    <PlayerStateContext.Provider value={state}>
      <PlayerProgressContext.Provider value={progressValue}>
        {children}
      </PlayerProgressContext.Provider>
    </PlayerStateContext.Provider>
  );
}

export function usePlayer() {
  const state = useContext(PlayerStateContext);
  const progress = useContext(PlayerProgressContext);
  if (!state || !progress) throw new Error("usePlayer must be used within PlayerProvider");
  return { ...state, ...progress };
}

/** Prefer this in browse surfaces so progress ticks do not re-render the tree. */
export function usePlayerState() {
  const state = useContext(PlayerStateContext);
  if (!state) throw new Error("usePlayerState must be used within PlayerProvider");
  return state;
}

export function usePlayerProgress() {
  const progress = useContext(PlayerProgressContext);
  if (!progress) throw new Error("usePlayerProgress must be used within PlayerProvider");
  return progress;
}
