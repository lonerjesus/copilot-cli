"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "kn.age.ok.v1";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** SSR / first paint must not claim the visitor already passed 18+. */
function getServerSnapshot() {
  return false;
}

/** True when the visitor has passed the 18+ gate (or age gate is off). */
export function useAgeConfirmed(): boolean {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Prefer the sync-external snapshot on the server (false) to avoid flashing the stream.
  if (typeof document === "undefined") return stored;
  if (document.documentElement.dataset.ageGate === "0") return true;
  return stored;
}

export { STORAGE_KEY as AGE_STORAGE_KEY };
