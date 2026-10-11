/**
 * Same-device resume / continue-watching memory for house AV.
 * Persists scrub progress so STREAM can surface a CONTINUE rail (Netflix-class retention)
 * without cross-device sync or third-party clones.
 */

export type PlaybackMemoryEntry = {
  id: string;
  progress: number;
  title: string;
  kind: string;
  at: number;
};

const KEY = "kn.player.resume.v1";
export const RESUME_EVENT = "kn-resume";
const MAX = 48;
/** Ignore tiny starts and near-complete finishes. */
const MIN_PROGRESS = 3;
const MAX_PROGRESS = 95;
const THROTTLE_MS = 1200;

const lastWrite = new Map<string, number>();

function notifyResume() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(RESUME_EVENT));
  } catch {
    /* */
  }
}

function readAll(): PlaybackMemoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlaybackMemoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e) =>
          e &&
          typeof e.id === "string" &&
          typeof e.progress === "number" &&
          Number.isFinite(e.progress),
      )
      .slice(0, MAX);
  } catch {
    return [];
  }
}

function writeAll(entries: PlaybackMemoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    /* private mode */
  }
}

export function getResume(id: string): PlaybackMemoryEntry | null {
  if (!id) return null;
  return readAll().find((e) => e.id === id) ?? null;
}

/** Resume percent for seeking native media, or null if not worth restoring. */
export function resumeSeekPercent(id: string): number | null {
  const entry = getResume(id);
  if (!entry) return null;
  if (entry.progress < MIN_PROGRESS || entry.progress > MAX_PROGRESS) return null;
  return entry.progress;
}

export function rememberProgress(input: {
  id: string;
  progress: number;
  title: string;
  kind: string;
  force?: boolean;
}): void {
  if (typeof window === "undefined") return;
  const { id, title, kind, force } = input;
  if (!id) return;
  const progress = Math.max(0, Math.min(100, input.progress));
  const now = Date.now();
  if (!force) {
    const prev = lastWrite.get(id) ?? 0;
    if (now - prev < THROTTLE_MS) return;
  }
  lastWrite.set(id, now);

  if (progress < MIN_PROGRESS) return;
  if (progress >= MAX_PROGRESS) {
    clearResume(id);
    return;
  }

  const next: PlaybackMemoryEntry = { id, progress, title, kind, at: now };
  const rest = readAll().filter((e) => e.id !== id);
  writeAll([next, ...rest]);
  notifyResume();
}

export function clearResume(id: string): void {
  if (!id) return;
  writeAll(readAll().filter((e) => e.id !== id));
  lastWrite.delete(id);
  notifyResume();
}

/** Newest unfinished items — CONTINUE shelf source. */
export function listContinues(limit = 12): PlaybackMemoryEntry[] {
  return readAll()
    .filter((e) => e.progress >= MIN_PROGRESS && e.progress <= MAX_PROGRESS)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}
