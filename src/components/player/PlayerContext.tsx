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
import { getQueue, isPlayableMedia, playableCatalog, type CatalogItem } from "@/data/catalog";

const AUTOPLAY_KEY = "kn.player.autoplay";
const VOLUME_KEY = "kn.player.volume";
const MUTED_KEY = "kn.player.muted";

function readAutoplayPref(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(AUTOPLAY_KEY);
    if (raw === null) return true;
    return raw === "1" || raw === "true";
  } catch {
    return true;
  }
}

function writeAutoplayPref(value: boolean) {
  try {
    window.localStorage.setItem(AUTOPLAY_KEY, value ? "1" : "0");
  } catch {
    /* private mode */
  }
}

function readVolumePref(): number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = window.localStorage.getItem(VOLUME_KEY);
    if (raw === null) return 1;
    const n = Number(raw);
    if (!Number.isFinite(n)) return 1;
    return Math.max(0, Math.min(1, n));
  } catch {
    return 1;
  }
}

function writeVolumePref(value: number) {
  try {
    window.localStorage.setItem(VOLUME_KEY, String(Math.max(0, Math.min(1, value))));
  } catch {
    /* private mode */
  }
}

function readMutedPref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMutedPref(value: boolean) {
  try {
    window.localStorage.setItem(MUTED_KEY, value ? "1" : "0");
  } catch {
    /* private mode */
  }
}

type PlayerStateValue = {
  queue: CatalogItem[];
  current: CatalogItem | null;
  index: number;
  playing: boolean;
  expanded: boolean;
  /** When on, selecting media starts playback. When off, loads paused. */
  autoplay: boolean;
  volume: number;
  muted: boolean;
  /** Items after the current index — Spotify-style Up Next. */
  upNext: CatalogItem[];
  playItem: (item: CatalogItem, queue?: CatalogItem[]) => void;
  /** Insert after current without interrupting playback (Play Next). */
  queueNext: (item: CatalogItem) => void;
  toggle: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  setExpanded: (value: boolean) => void;
  setAutoplay: (value: boolean) => void;
  setVolume: (value: number) => void;
  setMuted: (value: boolean) => void;
  toggleMute: () => void;
};

type PlayerProgressValue = {
  progress: number;
  setProgress: (value: number) => void;
};

const PlayerStateContext = createContext<PlayerStateValue | null>(null);
const PlayerProgressContext = createContext<PlayerProgressValue | null>(null);

function stepIndex(queue: CatalogItem[], from: number, dir: 1 | -1): number {
  if (!queue.length) return 0;
  let i = from;
  for (let n = 0; n < queue.length; n++) {
    i = (i + dir + queue.length) % queue.length;
    if (isPlayableMedia(queue[i]!)) return i;
  }
  return from;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => playableCatalog(getQueue()), []);
  const [queue, setQueue] = useState<CatalogItem[]>(initial);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [autoplay, setAutoplayState] = useState(() => readAutoplayPref());
  const [volume, setVolumeState] = useState(() => readVolumePref());
  const [muted, setMutedState] = useState(() => readMutedPref());
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);
  const playingRef = useRef(playing);
  const autoplayRef = useRef(autoplay);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  const setAutoplay = useCallback((value: boolean) => {
    setAutoplayState(value);
    writeAutoplayPref(value);
  }, []);

  const setVolume = useCallback((value: number) => {
    const next = Math.max(0, Math.min(1, value));
    setVolumeState(next);
    writeVolumePref(next);
    if (next > 0) {
      setMutedState(false);
      writeMutedPref(false);
    }
  }, []);

  const setMuted = useCallback((value: boolean) => {
    setMutedState(value);
    writeMutedPref(value);
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      const next = !m;
      writeMutedPref(next);
      return next;
    });
  }, []);

  const current = queue[index] && isPlayableMedia(queue[index]!) ? queue[index]! : null;
  const upNext = useMemo(
    () => queue.slice(index + 1).filter(isPlayableMedia),
    [queue, index],
  );

  const clearTimer = () => {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  };

  const next = useCallback(() => {
    // Manual skip keeps current play/pause; autoplay only gates select + ended.
    const keepPlaying = playingRef.current;
    setIndex((i) => stepIndex(queue, i, 1));
    setProgress(0);
    setPlaying(keepPlaying);
  }, [queue]);

  const prev = useCallback(() => {
    const keepPlaying = playingRef.current;
    setIndex((i) => stepIndex(queue, i, -1));
    setProgress(0);
    setPlaying(keepPlaying);
  }, [queue]);

  const playItem = useCallback((item: CatalogItem, nextQueue?: CatalogItem[]) => {
    if (!isPlayableMedia(item)) return;
    const raw = nextQueue ?? queue;
    const q = playableCatalog(raw);
    const withItem = q.some((entry) => entry.id === item.id) ? q : [item, ...q];
    const found = withItem.findIndex((entry) => entry.id === item.id);
    setQueue(withItem);
    setIndex(found >= 0 ? found : 0);
    setProgress(0);
    setPlaying(autoplayRef.current);
    setExpanded(true);
  }, [queue]);

  const queueNext = useCallback((item: CatalogItem) => {
    if (!isPlayableMedia(item)) return;
    setQueue((q) => {
      const playable = playableCatalog(q);
      const without = playable.filter((entry) => entry.id !== item.id);
      const at = Math.min(index + 1, without.length);
      return [...without.slice(0, at), item, ...without.slice(at)];
    });
    setExpanded(true);
  }, [index]);

  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const pause = useCallback(() => setPlaying(false), []);

  useEffect(() => {
    clearTimer();
    if (!current || !isPlayableMedia(current)) return;
    // Real embeds own playback — don't fake scrub/auto-advance.
    const liveEmbed = ["bandcamp", "soundcloud", "twitch", "youtube", "vimeo"].includes(
      current.embed?.provider ?? "",
    );
    const nativeOrUrl =
      Boolean(current.src) ||
      /youtube\.com|youtu\.be|vimeo\.com\/\d+|bandcamp\.com|soundcloud\.com|twitch\.tv/i.test(
        current.externalUrl ?? "",
      );
    if (!playing || liveEmbed || nativeOrUrl) return;
    timer.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (autoplayRef.current) {
            next();
          } else {
            setPlaying(false);
          }
          return 0;
        }
        return p + 0.35;
      });
    }, 120);
    return clearTimer;
  }, [playing, next, current]);

  const state = useMemo(
    () => ({
      queue,
      current,
      index,
      playing,
      expanded,
      autoplay,
      volume,
      muted,
      upNext,
      playItem,
      queueNext,
      toggle,
      pause,
      next,
      prev,
      setExpanded,
      setAutoplay,
      setVolume,
      setMuted,
      toggleMute,
    }),
    [
      queue,
      current,
      index,
      playing,
      expanded,
      autoplay,
      volume,
      muted,
      upNext,
      playItem,
      queueNext,
      toggle,
      pause,
      next,
      prev,
      setAutoplay,
      setVolume,
      setMuted,
      toggleMute,
    ],
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
