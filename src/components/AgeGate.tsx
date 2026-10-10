"use client";

import { useCallback } from "react";
import { track } from "@/lib/analytics";
import { AGE_STORAGE_KEY, useAgeConfirmed } from "@/components/useAgeConfirmed";

export function AgeGate() {
  const confirmed = useAgeConfirmed();

  const accept = useCallback(() => {
    try {
      window.localStorage.setItem(AGE_STORAGE_KEY, "1");
      window.dispatchEvent(new Event("storage"));
      track("age_accepted");
    } catch {
      /* ignore */
    }
  }, []);

  const required =
    typeof document === "undefined"
      ? true
      : document.documentElement.dataset.ageGate !== "0";

  if (!required || confirmed) return null;

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
