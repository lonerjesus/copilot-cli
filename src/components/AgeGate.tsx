"use client";

import { useCallback, useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";

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

function getServerSnapshot() {
  return true;
}

export function AgeGate() {
  const confirmed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const accept = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
      window.dispatchEvent(new Event("storage"));
      track("age_accepted");
    } catch {
      /* ignore */
    }
  }, []);

  if (confirmed) return null;

  return (
    <div className="agegate" role="alertdialog" aria-modal="true" aria-labelledby="agegate-title">
      <div className="agegate__panel">
        <h2 id="agegate-title">18+</h2>
        <p>Adults only.</p>
        <div className="agegate__actions">
          <button type="button" className="btn btn--primary" onClick={accept}>
            enter
          </button>
        </div>
      </div>
    </div>
  );
}
