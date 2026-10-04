"use client";

import { useEffect } from "react";

/**
 * Soft client-side save/scrape friction for members who have not purchased.
 * Real enforcement is server-side on /api/commerce/download.
 */
export function SaveGuard() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const saveCombo =
        (event.ctrlKey || event.metaKey) && (key === "s" || key === "p");
      if (saveCombo) {
        event.preventDefault();
      }
    };

    const onContext = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("img, video, audio, canvas, .deck__stage, .magazine__spread")) {
        event.preventDefault();
      }
    };

    const onDrag = (event: DragEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("img, video, audio")) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("contextmenu", onContext);
    window.addEventListener("dragstart", onDrag);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("contextmenu", onContext);
      window.removeEventListener("dragstart", onDrag);
    };
  }, []);

  return null;
}
