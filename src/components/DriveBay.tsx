"use client";

import type { ReactNode } from "react";

type DriveBayProps = {
  id: string;
  drive: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
  /** External compartment (page) instead of inline drawer */
  href?: string;
  meta?: string;
};

/**
 * Floppy / drive-bay compartment — one labeled drawer at a time.
 */
export function DriveBay({
  id,
  drive,
  label,
  open,
  onToggle,
  children,
  href,
  meta,
}: DriveBayProps) {
  if (href) {
    return (
      <a className="drive" href={href} id={id}>
        <span className="drive__face">
          <span className="drive__led" data-on="0" />
          <span className="drive__slot" aria-hidden />
          <span className="drive__id">{drive}:</span>
          <span className="drive__label">{label}</span>
          {meta ? <span className="drive__meta">{meta}</span> : null}
          <span className="drive__eject" aria-hidden>
            →
          </span>
        </span>
      </a>
    );
  }

  return (
    <section className={`drive ${open ? "is-open" : ""}`} id={id}>
      <button
        type="button"
        className="drive__face"
        aria-expanded={open}
        aria-controls={`${id}-tray`}
        onClick={onToggle}
      >
        <span className="drive__led" data-on={open ? "1" : "0"} />
        <span className="drive__slot" aria-hidden />
        <span className="drive__id">{drive}:</span>
        <span className="drive__label">{label}</span>
        {meta ? <span className="drive__meta">{meta}</span> : null}
        <span className={`drive__eject ${open ? "is-open" : ""}`} aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      <div
        id={`${id}-tray`}
        className="drive__tray"
        role="region"
        aria-label={label}
        aria-hidden={!open}
        hidden={!open}
      >
        {open ? children : null}
      </div>
    </section>
  );
}
