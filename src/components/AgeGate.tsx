"use client";

import { useCallback, useSyncExternalStore } from "react";

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
    } catch {
      /* ignore */
    }
  }, []);

  if (confirmed) return null;

  return (
    <div className="agegate" role="alertdialog" aria-modal="true" aria-labelledby="agegate-title">
      <div className="agegate__panel">
        <p className="agegate__eyebrow">content notice</p>
        <h2 id="agegate-title">18+ ONLY</h2>
        <p>
          Warning: this site is not for people under 18. Certain content may include mature language,
          adult themes, and material intended only for adults. Enter only if you are 18 or older.
        </p>
        <div className="agegate__actions">
          <button type="button" className="btn btn--primary" onClick={accept}>
            I am 18 or older
          </button>
          <a className="btn btn--ghost" href="https://www.google.com">
            exit
          </a>
        </div>
      </div>
    </div>
  );
}
